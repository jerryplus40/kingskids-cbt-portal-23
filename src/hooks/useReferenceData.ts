import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/lib/supabase';
import type { ClassSubject, SchoolClass, SchoolSettings, Session, Subject, Term } from '@/types/db';

// Reference data changes rarely; cache it for five minutes across pages
const STALE = 5 * 60 * 1000;

export const useSchoolSettings = () =>
  useQuery({
    queryKey: ['school_settings'],
    staleTime: STALE,
    queryFn: async () => unwrap(await supabase.from('school_settings').select('*').single()) as SchoolSettings,
  });

export const useClasses = () =>
  useQuery({
    queryKey: ['classes'],
    staleTime: STALE,
    queryFn: async () =>
      unwrap(await supabase.from('classes').select('*').order('sort_order').order('level').order('arm')) as SchoolClass[],
  });

export const useSubjects = () =>
  useQuery({
    queryKey: ['subjects'],
    staleTime: STALE,
    queryFn: async () => unwrap(await supabase.from('subjects').select('*').order('name')) as Subject[],
  });

export const useClassSubjects = () =>
  useQuery({
    queryKey: ['class_subjects'],
    staleTime: STALE,
    queryFn: async () => unwrap(await supabase.from('class_subjects').select('*')) as ClassSubject[],
  });

export const useSessions = () =>
  useQuery({
    queryKey: ['sessions'],
    staleTime: STALE,
    queryFn: async () => {
      const sessions = unwrap(await supabase.from('sessions').select('*').order('name', { ascending: false })) as Session[];
      const terms = unwrap(await supabase.from('terms').select('*').order('term')) as Term[];
      return sessions.map((session) => ({ ...session, terms: terms.filter((t) => t.session_id === session.id) }));
    },
  });

/** The current term with its session, from school settings. */
export const useCurrentTerm = () => {
  const settings = useSchoolSettings();
  const sessions = useSessions();
  const term = sessions.data?.flatMap((s) => s.terms.map((t) => ({ ...t, session: s }))).find((t) => t.id === settings.data?.current_term_id);
  return { term, isLoading: settings.isLoading || sessions.isLoading };
};
