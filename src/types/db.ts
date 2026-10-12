// Row shapes for the Supabase tables the app reads. Mirrors supabase/migrations.

export type AppRole = 'admin' | 'exam_officer' | 'teacher' | 'student' | 'parent' | 'applicant';

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrator',
  exam_officer: 'Exam officer',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  applicant: 'Entrance candidate',
};

export const STAFF_ROLES: AppRole[] = ['admin', 'exam_officer', 'teacher'];

export interface Profile {
  id: string;
  role: AppRole;
  login_id: string | null;
  first_name: string;
  last_name: string;
  other_name: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  admission_no: string;
  class_id: string | null;
  gender: 'male' | 'female' | null;
  date_of_birth: string | null;
  address: string | null;
}

export interface Session {
  id: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
}

export interface Term {
  id: string;
  session_id: string;
  term: 1 | 2 | 3;
  starts_on: string | null;
  ends_on: string | null;
  next_term_begins: string | null;
}

export interface SchoolClass {
  id: string;
  level: string;
  arm: string;
  name: string;
  stream: string | null;
  sort_order: number;
  class_teacher_id: string | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
}

export interface SchoolSettings {
  school_name: string;
  address: string | null;
  motto: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  current_term_id: string | null;
  ca_weight: number;
  exam_weight: number;
}

export interface AuditEntry {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export const fullName = (p: Pick<Profile, 'first_name' | 'last_name'> & { other_name?: string | null }) =>
  [p.first_name, p.other_name, p.last_name].filter(Boolean).join(' ');

export const TERM_LABELS: Record<number, string> = { 1: 'First term', 2: 'Second term', 3: 'Third term' };
