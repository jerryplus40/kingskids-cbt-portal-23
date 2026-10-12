// Creates the first administrator. Run once after deploy-backend.sh:
//   node --env-file=.env scripts/create-admin.mjs
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const { VITE_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, FIRST_ADMIN_EMAIL: email, FIRST_ADMIN_FIRST_NAME: first, FIRST_ADMIN_LAST_NAME: last } = process.env;
if (!url || !key || !email || !first || !last) {
  console.error('Set VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and FIRST_ADMIN_* in .env');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
// Lowercase, uppercase and a digit, as the Supabase password policy requires
const password = `kk-${randomBytes(6).toString('hex')}-Kk${randomBytes(1)[0] % 10}`;
const { data, error } = await db.auth.admin.createUser({
  email: email.toLowerCase(),
  password,
  email_confirm: true,
  app_metadata: { role: 'admin', must_change_password: true },
  user_metadata: { first_name: first, last_name: last },
});
if (error) {
  console.error(`Could not create ${email}: ${error.message}`);
  process.exit(1);
}
await db.from('profiles').update({ login_id: email.toLowerCase() }).eq('id', data.user.id);
console.log(`Administrator created.\n  Email: ${email}\n  Temporary password: ${password}\nSign in and choose a new password.`);
