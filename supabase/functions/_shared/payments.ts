import { serviceClient } from './supabase.ts';

/** Marks the applicant paid when Paystack confirms the full fee. Shared with the webhook. */
export async function recordPayment(reference: string, amountKobo: number, paidAt: string) {
  const db = serviceClient();
  const { data: applicant } = await db.from('applicants').select('id, status, paid_at, cycle:entrance_cycles(fee_kobo)').eq('payment_ref', reference).maybeSingle();
  if (!applicant || applicant.paid_at) return false;
  const fee = (applicant.cycle as unknown as { fee_kobo: number }).fee_kobo;
  if (amountKobo < fee) return false;
  await db
    .from('applicants')
    .update({ paid_at: paidAt, amount_paid_kobo: amountKobo, status: applicant.status === 'submitted' ? 'paid' : applicant.status, updated_at: new Date().toISOString() })
    .eq('id', applicant.id);
  return true;
}
