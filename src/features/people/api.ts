import { invokeFunction } from '@/lib/supabase';
import type { AppRole } from '@/types/db';

export interface GuardianInput {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  relationship?: string;
}

export interface NewUser {
  role: Exclude<AppRole, 'applicant'>;
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

/** Login details to hand to a person. password is null when the account already existed. */
export interface Credential {
  user_id: string;
  name: string;
  role: AppRole;
  login_id: string;
  password: string | null;
}

interface CreateResult {
  account: Credential;
  guardian: Credential | null;
}

export const createUser = (user: NewUser) => invokeFunction<CreateResult>('admin-users', { action: 'create', user });

export const bulkCreateUsers = (users: NewUser[]) =>
  invokeFunction<{ results: ({ index: number; ok: true } & CreateResult | { index: number; ok: false; error: string })[] }>(
    'admin-users',
    { action: 'bulk_create', users },
  );

export const resetPassword = (userId: string) => invokeFunction<Credential>('admin-users', { action: 'reset_password', user_id: userId });

export const setActive = (userId: string, active: boolean) =>
  invokeFunction<{ ok: true }>('admin-users', { action: 'set_active', user_id: userId, active });

export const changeRole = (userId: string, role: AppRole) =>
  invokeFunction<{ ok: true }>('admin-users', { action: 'update', user_id: userId, fields: { role } });

export const linkGuardian = (studentId: string, guardian: GuardianInput) =>
  invokeFunction<{ guardian: Credential | null }>('admin-users', { action: 'link_guardian', student_id: studentId, guardian });

/** Permanently removes the account and everything that belongs to it. */
export const deleteAccount = (userId: string) => invokeFunction<{ ok: true }>('admin-users', { action: 'delete', user_id: userId });
