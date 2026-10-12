import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import type { Student } from '@/types/db';

/** The signed-in student's record and class. */
export function useMyStudent() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['my_student', profile?.id],
    enabled: profile?.role === 'student',
    queryFn: async () =>
      unwrap(await supabase.from('students').select('*, class:classes(id, name)').eq('id', profile!.id).single()) as Student & {
        class: { id: string; name: string } | null;
      },
  });
}
