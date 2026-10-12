import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/lib/supabase';
import type { Exam, ExamQuestion, ExamSection, MonitorRow, MyExam } from './types';

export const useExams = () =>
  useQuery({
    queryKey: ['exams'],
    queryFn: async () => unwrap(await supabase.from('exams').select('*').order('created_at', { ascending: false })) as Exam[],
  });

export const useExam = (id?: string) =>
  useQuery({
    queryKey: ['exam', id],
    enabled: !!id,
    queryFn: async () => unwrap(await supabase.from('exams').select('*').eq('id', id!).single()) as Exam,
  });

export const useExamPaper = (examId?: string) =>
  useQuery({
    queryKey: ['exam_paper', examId],
    enabled: !!examId,
    queryFn: async () => {
      const sections = unwrap(await supabase.from('exam_sections').select('*').eq('exam_id', examId!).order('sort_order')) as ExamSection[];
      const questions = unwrap(await supabase.from('exam_questions').select('*').eq('exam_id', examId!).order('sort_order')) as ExamQuestion[];
      return { sections, questions };
    },
  });

export const useAttemptCounts = () =>
  useQuery({
    queryKey: ['attempt_counts'],
    queryFn: async () => {
      // Staff see attempts for exams they may view; count per exam in the browser
      const rows = unwrap(await supabase.from('attempts').select('exam_id, status')) as { exam_id: string; status: string }[];
      const counts = new Map<string, { started: number; submitted: number }>();
      for (const r of rows) {
        const c = counts.get(r.exam_id) ?? { started: 0, submitted: 0 };
        c.started++;
        if (r.status === 'submitted') c.submitted++;
        counts.set(r.exam_id, c);
      }
      return counts;
    },
  });

export const useMonitor = (examId?: string, refetchInterval = 10_000) =>
  useQuery({
    queryKey: ['monitor', examId],
    enabled: !!examId,
    refetchInterval,
    queryFn: async () => unwrap(await supabase.rpc('exam_monitor', { p_exam_id: examId })) as MonitorRow[],
  });

export const useMyExams = () =>
  useQuery({
    queryKey: ['my_exams'],
    refetchInterval: 60_000,
    queryFn: async () => unwrap(await supabase.rpc('my_exams')) as MyExam[],
  });
