import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** Client with full access. Never return its results unfiltered. */
export const serviceClient = (): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

/** Client acting as the caller, so row-level security and has_perm() apply. */
export const callerClient = (req: Request): SupabaseClient =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

export async function requirePerm(req: Request, permission: string): Promise<{ userId: string } | Response> {
  const caller = callerClient(req);
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Not signed in' }, 401);
  const { data: allowed, error } = await caller.rpc('has_perm', { p: permission });
  if (error || !allowed) return json({ error: 'You do not have permission to do this' }, 403);
  return { userId: userData.user.id };
}

/** Readable temporary password, e.g. "kk-Hq4P-z7Mx". Avoids look-alike characters. */
export function tempPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `kk-${chars.slice(0, 4)}-${chars.slice(4)}`;
}
