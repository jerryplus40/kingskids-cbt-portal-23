// Creates and manages login accounts. Only callers with users.manage may use it.
// Account creation needs the service-role key, so it cannot happen in the browser.
import { callerClient, corsHeaders, json, requirePerm, serviceClient, tempPassword } from '../_shared/supabase.ts';
import { normalisePhone, parentEmail, studentEmail } from '../_shared/login-id.ts';

type Role = 'admin' | 'exam_officer' | 'teacher' | 'student' | 'parent';

interface GuardianInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  relationship?: string;
}

interface NewUser {
  role: Role;
  first_name: string;
  last_name: string;
  other_name?: string;
  email?: string;
  phone?: string;
  student?: {
    admission_no: string;
    class_id?: string | null;
    gender?: 'male' | 'female' | null;
    date_of_birth?: string | null;
    address?: string | null;
  };
  guardian?: GuardianInput;
}

interface Credential {
  user_id: string;
  name: string;
  role: Role;
  login_id: string;
  password: string | null; // null when the account already existed
}

const STAFF_ROLES: Role[] = ['admin', 'exam_officer', 'teacher'];
const ROLES: Role[] = [...STAFF_ROLES, 'student', 'parent'];
const UPDATABLE_FIELDS = ['first_name', 'last_name', 'other_name', 'phone', 'role'] as const;
const MAX_BULK = 100;

const db = serviceClient();

function authIdentity(user: NewUser): { email: string; loginId: string } {
  if (STAFF_ROLES.includes(user.role)) {
    const email = user.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) throw new Error('Staff accounts need an email address');
    return { email, loginId: email };
  }
  if (user.role === 'student') {
    const admissionNo = user.student?.admission_no?.trim();
    if (!admissionNo) throw new Error('Students need an admission number');
    return { email: studentEmail(admissionNo), loginId: admissionNo };
  }
  if (user.role === 'parent') {
    const phone = user.phone && normalisePhone(user.phone);
    if (!phone) throw new Error('Parents need a valid Nigerian phone number');
    return { email: parentEmail(phone), loginId: phone };
  }
  throw new Error(`Unknown role ${user.role}`);
}

async function createAccount(user: NewUser): Promise<Credential> {
  const name = `${user.first_name} ${user.last_name}`.trim();
  if (!user.first_name?.trim() || !user.last_name?.trim()) throw new Error('First and last name are required');
  const { email, loginId } = authIdentity(user);
  const password = tempPassword();

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: user.role, must_change_password: true },
    user_metadata: { first_name: user.first_name.trim(), last_name: user.last_name.trim() },
  });
  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('already')) throw new Error(`An account for ${loginId} already exists`);
    throw new Error(error?.message ?? 'Could not create account');
  }
  const userId = data.user.id;

  try {
    const { error: profileError } = await db
      .from('profiles')
      .update({
        login_id: loginId,
        other_name: user.other_name?.trim() || null,
        phone: user.role === 'parent' ? loginId : user.phone?.trim() || null,
        // Placeholder addresses cannot receive mail, so only keep a real one
        email: STAFF_ROLES.includes(user.role) ? email : user.email?.trim().toLowerCase() || null,
      })
      .eq('id', userId);
    if (profileError) throw profileError;

    if (user.role === 'student' && user.student) {
      const { error: studentError } = await db.from('students').insert({
        id: userId,
        admission_no: user.student.admission_no.trim(),
        class_id: user.student.class_id || null,
        gender: user.student.gender || null,
        date_of_birth: user.student.date_of_birth || null,
        address: user.student.address || null,
      });
      if (studentError) {
        throw new Error(studentError.code === '23505' ? `Admission number ${user.student.admission_no} is already used` : studentError.message);
      }
    }
  } catch (err) {
    // Roll back the half-created account so the admin can retry cleanly
    await db.auth.admin.deleteUser(userId);
    throw err;
  }

  return { user_id: userId, name, role: user.role, login_id: loginId, password };
}

/** Finds the parent account for a phone number, creating it if needed, and links it to the student. */
async function linkGuardian(studentId: string, guardian: GuardianInput): Promise<Credential | null> {
  const phone = normalisePhone(guardian.phone);
  if (!phone) throw new Error(`Guardian phone ${guardian.phone} is not a valid Nigerian number`);

  const { data: existing } = await db.from('profiles').select('id, first_name, last_name').eq('login_id', phone).maybeSingle();
  let credential: Credential | null = null;
  let guardianId = existing?.id as string | undefined;
  if (!guardianId) {
    credential = await createAccount({
      role: 'parent',
      first_name: guardian.first_name,
      last_name: guardian.last_name,
      phone,
      email: guardian.email,
    });
    guardianId = credential.user_id;
  } else {
    credential = { user_id: guardianId, name: `${existing!.first_name} ${existing!.last_name}`, role: 'parent', login_id: phone, password: null };
  }

  const { error } = await db
    .from('student_guardians')
    .upsert({ student_id: studentId, guardian_id: guardianId, relationship: guardian.relationship || null });
  if (error) throw new Error(error.message);
  return credential;
}

async function createWithGuardian(user: NewUser) {
  const account = await createAccount(user);
  const guardian = user.role === 'student' && user.guardian?.phone ? await linkGuardian(account.user_id, user.guardian) : null;
  return { account, guardian };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const auth = await requirePerm(req, 'users.manage');
  if (auth instanceof Response) return auth;

  // Service-role writes carry no user, so record the acting admin explicitly
  const caller = callerClient(req);
  const audit = (action: string, userId: string, details?: Record<string, unknown>) =>
    caller.rpc('log_action', { p_action: action, p_entity: 'account', p_entity_id: userId, p_details: details ?? null });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  try {
    switch (body.action) {
      case 'create': {
        const result = await createWithGuardian(body.user as NewUser);
        await audit('account.create', result.account.user_id, { role: result.account.role, login_id: result.account.login_id });
        return json(result);
      }

      case 'bulk_create': {
        const users = body.users as NewUser[];
        if (!Array.isArray(users) || users.length === 0) return json({ error: 'No users given' }, 400);
        if (users.length > MAX_BULK) return json({ error: `Send at most ${MAX_BULK} users per request` }, 400);
        // Sequential on purpose: rows can share a guardian, and the auth API rate-limits bursts
        const results = [];
        for (const [index, user] of users.entries()) {
          try {
            const result = await createWithGuardian(user);
            await audit('account.create', result.account.user_id, { role: result.account.role, login_id: result.account.login_id, bulk: true });
            results.push({ index, ok: true, ...result });
          } catch (err) {
            results.push({ index, ok: false, error: (err as Error).message });
          }
        }
        return json({ results });
      }

      case 'link_guardian': {
        const studentId = body.student_id as string;
        const guardian = await linkGuardian(studentId, body.guardian as GuardianInput);
        if (guardian) await audit('account.link_guardian', studentId, { guardian_id: guardian.user_id });
        return json({ guardian });
      }

      case 'update': {
        const userId = body.user_id as string;
        const input = (body.fields ?? {}) as Record<string, unknown>;
        const fields = Object.fromEntries(
          UPDATABLE_FIELDS.filter((key) => key in input).map((key) => [key, input[key]]),
        ) as Partial<Record<(typeof UPDATABLE_FIELDS)[number], string>>;
        if (fields.role && !ROLES.includes(fields.role as Role)) return json({ error: 'Unknown role' }, 400);
        if (fields.role) {
          if (userId === auth.userId) return json({ error: 'You cannot change your own role' }, 400);
          const { error } = await db.auth.admin.updateUserById(userId, { app_metadata: { role: fields.role } });
          if (error) throw error;
        }
        const { error } = await db
          .from('profiles')
          .update({ ...fields, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) throw error;
        await audit('account.update', userId, fields);
        return json({ ok: true });
      }

      case 'set_active': {
        const userId = body.user_id as string;
        const active = Boolean(body.active);
        if (userId === auth.userId) return json({ error: 'You cannot deactivate your own account' }, 400);
        // Banning blocks new sign-ins and token refreshes; is_active removes permissions at once
        const { error: banError } = await db.auth.admin.updateUserById(userId, { ban_duration: active ? 'none' : '876000h' });
        if (banError) throw banError;
        const { error } = await db.from('profiles').update({ is_active: active }).eq('id', userId);
        if (error) throw error;
        await audit(active ? 'account.activate' : 'account.deactivate', userId);
        return json({ ok: true });
      }

      case 'reset_password': {
        const userId = body.user_id as string;
        const password = tempPassword();
        const { error } = await db.auth.admin.updateUserById(userId, { password });
        if (error) throw error;
        await db.from('profiles').update({ must_change_password: true }).eq('id', userId);
        const { data: profile } = await db.from('profiles').select('login_id, first_name, last_name, role').eq('id', userId).single();
        await audit('account.reset_password', userId);
        return json({
          user_id: userId,
          name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim(),
          role: profile?.role,
          login_id: profile?.login_id,
          password,
        });
      }

      default:
        return json({ error: 'Unknown action' }, 400);
    }
  } catch (err) {
    return json({ error: (err as Error).message }, 400);
  }
});
