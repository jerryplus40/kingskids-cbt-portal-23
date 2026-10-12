import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/lib/supabase';
import type { Profile, Student } from '@/types/db';

export interface StudentRow extends Student {
  profile: Profile;
  class: { name: string } | null;
  guardians: { relationship: string | null; guardian: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'login_id'> }[];
}

export interface ParentRow extends Profile {
  children: { student: { admission_no: string; profile: Pick<Profile, 'first_name' | 'last_name'> } }[];
}

// students.id references profiles, and student_guardians links the two tables as well,
// so embeds name the foreign key to avoid PostgREST's "more than one relationship" error.
export const STUDENT_SELECT =
  '*, profile:profiles!students_id_fkey(*), class:classes(name), guardians:student_guardians(relationship, guardian:profiles!student_guardians_guardian_id_fkey(id, first_name, last_name, login_id))';

export const useStudents = () =>
  useQuery({
    queryKey: ['people', 'students'],
    queryFn: async () => unwrap(await supabase.from('students').select(STUDENT_SELECT).order('admission_no')) as unknown as StudentRow[],
  });

export const useStaff = () =>
  useQuery({
    queryKey: ['people', 'staff'],
    queryFn: async () =>
      unwrap(
        await supabase.from('profiles').select('*').in('role', ['admin', 'exam_officer', 'teacher']).order('last_name'),
      ) as Profile[],
  });

export const useParents = () =>
  useQuery({
    queryKey: ['people', 'parents'],
    queryFn: async () =>
      unwrap(
        await supabase
          .from('profiles')
          .select('*, children:student_guardians!student_guardians_guardian_id_fkey(student:students(admission_no, profile:profiles!students_id_fkey(first_name, last_name)))')
          .eq('role', 'parent')
          .order('last_name'),
      ) as unknown as ParentRow[],
  });
