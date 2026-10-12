// Receives Paystack events. Only requests signed with our secret key are trusted.
import { json } from '../_shared/supabase.ts';
import { hmacSha512Hex, safeEqual } from '../_shared/crypto.ts';
import { recordPayment } from '../_shared/payments.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
  const raw = await req.text();
  const signature = req.headers.get('x-paystack-signature') ?? '';
  if (!secret || !safeEqual(await hmacSha512Hex(secret, raw), signature)) return json({ error: 'Invalid signature' }, 401);

  const event = JSON.parse(raw);
  if (event.event === 'charge.success' && event.data?.status === 'success') {
    await recordPayment(event.data.reference, event.data.amount, event.data.paid_at ?? new Date().toISOString());
  }
  // Always acknowledge, or Paystack keeps retrying
  return json({ received: true });
});
