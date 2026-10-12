// Starts a Paystack payment for an entrance application, or checks one. Public: the
// caller proves ownership with the application number and its secret.
import { corsHeaders, json, serviceClient } from '../_shared/supabase.ts';
import { sha256Hex } from '../_shared/crypto.ts';
import { recordPayment } from '../_shared/payments.ts';

const PAYSTACK = 'https://api.paystack.co';

async function paystack(path: string, init: RequestInit = {}) {
  const response = await fetch(`${PAYSTACK}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`, 'Content-Type': 'application/json', ...init.headers },
  });
  const payload = await response.json();
  if (!response.ok || !payload.status) throw new Error(payload.message ?? `Paystack ${response.status}`);
  return payload.data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!Deno.env.get('PAYSTACK_SECRET_KEY')) return json({ error: 'Online payment is not set up. Pay at the school office.' }, 400);

  const body = await req.json().catch(() => ({}));
  const applicationNo = String(body.application_no ?? '').trim().toUpperCase();
  const tokenHash = await sha256Hex(String(body.token ?? ''));
  const db = serviceClient();
  const { data: applicant } = await db
    .from('applicants')
    .select('id, application_no, guardian_email, payment_ref, paid_at, cycle:entrance_cycles(fee_kobo, title)')
    .eq('application_no', applicationNo)
    .eq('access_token_hash', tokenHash)
    .maybeSingle();
  if (!applicant) return json({ error: 'Application not found' }, 404);
  if (applicant.paid_at) return json({ paid: true });
  const cycle = applicant.cycle as unknown as { fee_kobo: number; title: string };

  try {
    if (body.action === 'verify') {
      if (!applicant.payment_ref) return json({ paid: false });
      const tx = await paystack(`/transaction/verify/${encodeURIComponent(applicant.payment_ref)}`);
      const paid = tx.status === 'success' && (await recordPayment(applicant.payment_ref, tx.amount, tx.paid_at ?? new Date().toISOString()));
      return json({ paid });
    }

    // A fresh reference each time, so an abandoned checkout never blocks a retry
    const reference = `${applicant.application_no.replace(/\//g, '-')}-${Date.now()}`;
    const origin = Deno.env.get('SITE_URL') ?? req.headers.get('origin') ?? '';
    const tx = await paystack('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: applicant.guardian_email,
        amount: cycle.fee_kobo,
        reference,
        callback_url: `${origin}/entrance/status?no=${encodeURIComponent(applicant.application_no)}&token=${encodeURIComponent(String(body.token))}`,
        metadata: { application_no: applicant.application_no, cycle: cycle.title },
      }),
    });
    await db.from('applicants').update({ payment_ref: reference }).eq('id', applicant.id);
    return json({ authorization_url: tx.authorization_url });
  } catch (err) {
    return json({ error: (err as Error).message }, 502);
  }
});
