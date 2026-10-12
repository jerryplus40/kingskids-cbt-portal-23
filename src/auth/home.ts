import type { AppRole } from '@/types/db';

/** Where each role lands after signing in. */
export const HOME_BY_ROLE: Record<AppRole, string> = {
  admin: '/admin',
  exam_officer: '/staff',
  teacher: '/staff',
  student: '/student',
  parent: '/parent',
  applicant: '/candidate',
};
