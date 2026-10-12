import { useQuery } from '@tanstack/react-query';
import { supabase, unwrap } from '@/lib/supabase';
import type { Passage, Question, QuestionOption } from './types';

export interface QuestionFilters {
  subjectId?: string;
  status?: 'draft' | 'approved';
  importId?: string;
}

export const QUESTION_SELECT = '*, options:question_options(*), passage:passages(*)';

const sortOptions = (q: Question) => ({ ...q, options: [...q.options].sort((a, b) => a.label.localeCompare(b.label)) });

export const useQuestions = (filters: QuestionFilters) =>
  useQuery({
    queryKey: ['questions', filters],
    enabled: !!filters.subjectId || !!filters.importId,
    queryFn: async () => {
      let query = supabase.from('questions').select(QUESTION_SELECT).eq('archived', false).order('created_at', { ascending: false });
      if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.importId) query = query.eq('import_id', filters.importId);
      return (unwrap(await query.limit(5000)) as unknown as Question[]).map(sortOptions);
    },
  });

export const usePassages = (subjectId?: string) =>
  useQuery({
    queryKey: ['passages', subjectId],
    enabled: !!subjectId,
    queryFn: async () => unwrap(await supabase.from('passages').select('*').eq('subject_id', subjectId!).order('created_at', { ascending: false })) as Passage[],
  });

export interface QuestionImport {
  id: string;
  file_name: string;
  row_count: number;
  created_at: string;
  created_by: string | null;
}

export const useImports = () =>
  useQuery({
    queryKey: ['question_imports'],
    queryFn: async () => unwrap(await supabase.from('question_imports').select('*').order('created_at', { ascending: false }).limit(50)) as QuestionImport[],
  });

/** Saves a question and its options. Options not in the list are deleted. */
export async function saveQuestion(
  question: Partial<Question> & Pick<Question, 'subject_id' | 'body' | 'type'>,
  options: Omit<QuestionOption, 'id' | 'question_id'>[],
): Promise<string> {
  const fields = {
    subject_id: question.subject_id,
    class_level: question.class_level || null,
    topic: question.topic || null,
    difficulty: question.difficulty ?? 'medium',
    type: question.type,
    body: question.body,
    image_url: question.image_url || null,
    passage_id: question.passage_id || null,
    marks: question.marks ?? 1,
    explanation: question.explanation || null,
  };
  let id = question.id;
  if (id) {
    unwrap(await supabase.from('questions').update(fields).eq('id', id));
  } else {
    const { data: auth } = await supabase.auth.getUser();
    id = (unwrap(await supabase.from('questions').insert({ ...fields, created_by: auth.user!.id }).select('id').single()) as { id: string }).id;
  }
  const keep = question.type === 'mcq' ? options.filter((o) => o.body.trim() || o.image_url) : [];
  unwrap(await supabase.from('question_options').delete().eq('question_id', id).not('label', 'in', `(${keep.map((o) => o.label).join(',') || 'Z'})`));
  if (keep.length) {
    unwrap(
      await supabase
        .from('question_options')
        .upsert(keep.map((o) => ({ question_id: id, label: o.label, body: o.body, image_url: o.image_url || null, is_correct: o.is_correct })), {
          onConflict: 'question_id,label',
        }),
    );
  }
  return id;
}
