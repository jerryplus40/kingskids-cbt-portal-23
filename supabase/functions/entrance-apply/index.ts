// Public entrance application. Validates input, stores the application and returns the
// application number with a secret for checking status and paying. No sign-in needed.
import { corsHeaders, json, serviceClient } from '../_shared/supabase.ts';
import { normalisePhone } from '../_shared/login-id.ts';
import { randomToken, sha256Hex } from '../_shared/crypto.ts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (value: unknown, max = 200) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }
  // Bots fill every field; people never see this one
  if (text(body.website)) return json({ error: 'Invalid request' }, 400);

  const db = serviceClient();
  const { data: cycle } = await db.from('entrance_cycles').select('*').eq('id', text(body.cycle_id)).maybeSingle();
  const now = Date.now();
  if (!cycle || !cycle.is_open || (cycle.opens_at && now < Date.parse(cycle.opens_at)) || (cycle.closes_at && now > Date.parse(cycle.closes_at))) {
    return json({ error: 'Applications for this class are not open' }, 400);
  }

  const applicant = {
    first_name: text(body.first_name, 60),
    last_name: text(body.last_name, 60),
    other_name: text(body.other_name, 60) || null,
    gender: ['male', 'female'].includes(text(body.gender)) ? text(body.gender) : null,
    date_of_birth: /^\d{4}-\d{2}-\d{2}$/.test(text(body.date_of_birth)) ? text(body.date_of_birth) : null,
    previous_school: text(body.previous_school, 120) || null,
    address: text(body.address, 300) || null,
    guardian_name: text(body.guardian_name, 120),
    guardian_phone: normalisePhone(text(body.guardian_phone)),
    guardian_email: text(body.guardian_email, 120).toLowerCase() || null,
  };
  const problems: string[] = [];
  if (!applicant.first_name || !applicant.last_name) problems.push("the child's first and last name");
  if (!applicant.guardian_name) problems.push("the parent or guardian's name");
  if (!applicant.guardian_phone) problems.push('a valid Nigerian phone number');
  if (applicant.guardian_email && !EMAIL.test(applicant.guardian_email)) problems.push('a valid email address');
  if (cycle.fee_kobo > 0 && !applicant.guardian_email) problems.push('an email address for the payment receipt');
  if (body.consent !== true) problems.push('agreement to the privacy notice');
  if (problems.length) return json({ error: `Please provide ${problems.join(', ')}.` }, 400);

  // A family rarely applies more than a few times an hour; this blunts automated abuse
  const since = new Date(now - 60 * 60 * 1000).toISOString();
  const { count } = await db.from('applicants').select('id', { count: 'exact', head: true }).eq('guardian_phone', applicant.guardian_phone).gte('created_at', since);
  if ((count ?? 0) >= 5) return json({ error: 'Too many applications from this phone number. Try again later.' }, 429);

  const { data: applicationNo, error: numberError } = await db.rpc('next_application_no');
  if (numberError) return json({ error: 'Could not create the application. Try again.' }, 500);
  const token = randomToken();

  const { error } = await db.from('applicants').insert({
    ...applicant,
    cycle_id: cycle.id,
    application_no: applicationNo,
    access_token_hash: await sha256Hex(token),
    consent_at: new Date().toISOString(),
    // Free rounds skip payment
    status: cycle.fee_kobo > 0 ? 'submitted' : 'paid',
  });
  if (error) return json({ error: 'Could not save the application. Try again.' }, 500);

  return json({ application_no: applicationNo, token, fee_kobo: cycle.fee_kobo });
});
