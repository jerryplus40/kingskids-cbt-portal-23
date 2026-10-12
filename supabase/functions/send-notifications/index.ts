// Sends queued messages from message_outbox: SMS through Termii, email through Resend.
// Call it as an admin (the "Send now" button), or on a schedule with the CRON_SECRET header.
// A channel whose API key is not configured is skipped, and its messages stay queued.
import { corsHeaders, json, requirePerm, serviceClient } from '../_shared/supabase.ts';

const BATCH = 100;
const MAX_ATTEMPTS = 3;

interface Message {
  id: number;
  channel: 'sms' | 'email';
  recipient: string;
  subject: string | null;
  body: string;
  attempts: number;
}

async function sendSms(to: string, text: string): Promise<void> {
  const base = Deno.env.get('TERMII_BASE_URL') ?? 'https://api.ng.termii.com';
  const response = await fetch(`${base}/api/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: Deno.env.get('TERMII_API_KEY'),
      to,
      from: Deno.env.get('TERMII_SENDER_ID') ?? 'KingsKids',
      sms: text,
      type: 'plain',
      // "dnd" reaches numbers on Do-Not-Disturb but needs an approved sender ID
      channel: Deno.env.get('TERMII_CHANNEL') ?? 'generic',
    }),
  });
  if (!response.ok) throw new Error(`Termii ${response.status}: ${(await response.text()).slice(0, 200)}`);
}

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}` },
    body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM') ?? 'King\'s Kids CBT <noreply@kingskidschools.com>', to, subject, text }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 200)}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const cronSecret = Deno.env.get('CRON_SECRET');
  const fromCron = !!cronSecret && req.headers.get('x-cron-secret') === cronSecret;
  if (!fromCron) {
    const auth = await requirePerm(req, 'settings.manage');
    if (auth instanceof Response) return auth;
  }

  const channels = [
    ...(Deno.env.get('TERMII_API_KEY') ? ['sms'] : []),
    ...(Deno.env.get('RESEND_API_KEY') ? ['email'] : []),
  ];
  const db = serviceClient();
  const { count: waiting } = await db.from('message_outbox').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  if (channels.length === 0) {
    return json({ sent: 0, failed: 0, waiting: waiting ?? 0, note: 'No SMS or email provider is configured' });
  }

  const { data: messages, error } = await db
    .from('message_outbox')
    .select('id, channel, recipient, subject, body, attempts')
    .eq('status', 'pending')
    .in('channel', channels)
    .order('created_at')
    .limit(BATCH);
  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  let failed = 0;
  for (const message of (messages ?? []) as Message[]) {
    try {
      if (message.channel === 'sms') await sendSms(message.recipient, message.body);
      else await sendEmail(message.recipient, message.subject ?? 'King\'s Kids CBT Portal', message.body);
      await db.from('message_outbox').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: message.attempts + 1 }).eq('id', message.id);
      sent++;
    } catch (err) {
      const attempts = message.attempts + 1;
      await db
        .from('message_outbox')
        .update({ status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending', attempts, error: (err as Error).message })
        .eq('id', message.id);
      failed++;
    }
  }
  return json({ sent, failed, waiting: Math.max(0, (waiting ?? 0) - sent) });
});
