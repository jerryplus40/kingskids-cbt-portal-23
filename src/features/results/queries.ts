import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/lib/supabase';
import type { BroadsheetRow, GradeBand, ReportCardData, ReportComment, TermScore } from './types';

export const useGradeScale = () =>
  useQuery({
    queryKey: ['grade_scales'],
    queryFn: async () => unwrap(await supabase.from('grade_scales').select('*').order('min_score', { ascending: false })) as GradeBand[],
  });

export const useTermScores = (termId?: string, classId?: string, subjectId?: string) =>
  useQuery({
    queryKey: ['term_scores', termId, classId, subjectId],
    enabled: !!termId && !!classId && !!subjectId,
    queryFn: async () =>
      unwrap(await supabase.from('term_scores').select('*').eq('term_id', termId!).eq('class_id', classId!).eq('subject_id', subjectId!)) as TermScore[],
  });

export const useBroadsheet = (termId?: string, classId?: string) =>
  useQuery({
    queryKey: ['broadsheet', termId, classId],
    enabled: !!termId && !!classId,
    queryFn: async () => unwrap(await supabase.rpc('class_broadsheet', { p_term_id: termId, p_class_id: classId })) as BroadsheetRow[],
  });

export const useReportComments = (termId?: string, studentIds: string[] = []) =>
  useQuery({
    queryKey: ['report_comments', termId, studentIds.join(',')],
    enabled: !!termId && studentIds.length > 0,
    queryFn: async () =>
      unwrap(await supabase.from('report_comments').select('*').eq('term_id', termId!).in('student_id', studentIds)) as ReportComment[],
  });

export const useReleases = (termId?: string) =>
  useQuery({
    queryKey: ['result_releases', termId],
    enabled: !!termId,
    queryFn: async () =>
      unwrap(await supabase.from('result_releases').select('*').eq('term_id', termId!)) as { term_id: string; class_id: string; released_at: string }[],
  });

export const fetchReportCard = async (studentId: string, termId: string) =>
  unwrap(await supabase.rpc('report_card', { p_student_id: studentId, p_term_id: termId })) as ReportCardData;

export const useReportCard = (studentId?: string, termId?: string) =>
  useQuery({
    queryKey: ['report_card', studentId, termId],
    enabled: !!studentId && !!termId,
    queryFn: () => fetchReportCard(studentId!, termId!),
  });

export interface ReportCardListing {
  student_id: string;
  term_id: string;
  term: number;
  session: string;
  released_at: string;
}

export const useMyReportCards = (studentId?: string) =>
  useQuery({
    queryKey: ['my_report_cards', studentId ?? 'me'],
    queryFn: async () => unwrap(await supabase.rpc('my_report_cards', studentId ? { p_student_id: studentId } : {})) as ReportCardListing[],
  });
