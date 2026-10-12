// Schedules paid applicants for the entrance exam: creates their candidate account,
// adds them to the exam and queues an SMS with their login. Needs entrance.manage.
import { callerClient, corsHeaders, json, requirePerm, serviceClient, tempPassword } from '../_shared/supabase.ts';
import { applicantEmail } from '../_shared/login-id.ts';

interface Applicant {
  id: string;
  application_no: string;
  first_name: string;
  last_name: string;
  guardian_phone: string;
  status: string;
  user_id: string | null;
  cycle: { exam_id: string | null; title: string; fee_kobo: number };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const auth = await requirePerm(req, 'entrance.manage');
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => ({}));
  if (body.action !== 'schedule' || !Array.isArray(body.applicant_ids)) return json({ error: 'Unknown action' }, 400);
  const resend = body.reset_passwords === true;

  const db = serviceClient();
  const caller = callerClient(req);
  const { data: settings } = await db.from('school_settings').select('school_name').single();
  const { data: rows, error } = await db
    .from('applicants')
    .select('id, application_no, first_name, last_name, guardian_phone, status, user_id, cycle:entrance_cycles(exam_id, title, fee_kobo)')
    .in('id', body.applicant_ids.slice(0, 200));
  if (error) return json({ error: error.message }, 500);

  const results = [];
  for (const applicant of (rows ?? []) as unknown as Applicant[]) {
    try {
      if (!applicant.cycle.exam_id) throw new Error('Link an entrance exam to this admission round first');
      if (!['paid', 'scheduled'].includes(applicant.status)) throw new Error('Not paid yet');
      let userId = applicant.user_id;
      let password: string | null = null;
      if (!userId) {
        password = tempPassword();
        const { data, error: createError } = await db.auth.admin.createUser({
          email: applicantEmail(applicant.application_no),
          password,
          email_confirm: true,
          app_metadata: { role: 'applicant' },
          user_metadata: { first_name: applicant.first_name, last_name: applicant.last_name },
        });
        if (createError || !data.user) throw new Error(createError?.message ?? 'Could not create the account');
        userId = data.user.id;
        await db.from('profiles').update({ login_id: applicant.application_no, email: null }).eq('id', userId);
      } else if (resend) {
        password = tempPassword();
        await db.auth.admin.updateUserById(userId, { password });
      }
      await db.from('exam_candidates').upsert({ exam_id: applicant.cycle.exam_id, candidate_id: userId });
      await db.from('applicants').update({ user_id: userId, status: 'scheduled', updated_at: new Date().toISOString() }).eq('id', applicant.id);
      if (password) {
        await db.from('message_outbox').insert({
          channel: 'sms',
          recipient: applicant.guardian_phone,
          body: `${settings?.school_name ?? 'School'} entrance exam: ${applicant.first_name} ${applicant.last_name}, login ${applicant.application_no}, password ${password}. Bring this to the exam.`,
        });
      }
      await caller.rpc('log_action', { p_action: 'entrance.schedule', p_entity: 'applicants', p_entity_id: applicant.id, p_details: null });
      results.push({ id: applicant.id, ok: true, application_no: applicant.application_no, name: `${applicant.first_name} ${applicant.last_name}`, password });
    } catch (err) {
      results.push({ id: applicant.id, ok: false, application_no: applicant.application_no, error: (err as Error).message });
    }
  }
  return json({ results });
});
