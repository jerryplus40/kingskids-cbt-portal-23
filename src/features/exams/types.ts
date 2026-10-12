export type ExamKind = 'test' | 'exam' | 'practice' | 'entrance';
export type ExamStatus = 'draft' | 'published' | 'closed';
export type CountsAs = 'none' | 'ca' | 'exam';

export const KIND_LABELS: Record<ExamKind, string> = {
  test: 'Class test',
  exam: 'Examination',
  practice: 'Practice',
  entrance: 'Entrance exam',
};

export const COUNTS_AS_LABELS: Record<CountsAs, string> = {
  none: 'Does not count',
  ca: 'Counts towards CA',
  exam: 'Counts as the term exam',
};

export interface Exam {
  id: string;
  title: string;
  kind: ExamKind;
  subject_id: string | null;
  class_id: string | null;
  term_id: string | null;
  instructions: string | null;
  duration_minutes: number;
  opens_at: string | null;
  closes_at: string | null;
  max_attempts: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  calculator: boolean;
  lockdown: boolean;
  show_score: boolean;
  results_released: boolean;
  review_allowed: boolean;
  counts_as: CountsAs;
  status: ExamStatus;
  created_by: string | null;
  created_at: string;
}

export interface ExamSection {
  id: string;
  exam_id: string;
  title: string;
  subject_id: string | null;
  instructions: string | null;
  sort_order: number;
  random_count: number | null;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  section_id: string;
  question_id: string;
  sort_order: number;
  marks: number | null;
}

// What start_exam() returns to the candidate (no answer key)
export interface PaperOption {
  id: string;
  label: string;
  body: string;
  image_url: string | null;
}

export interface PaperQuestion {
  id: string;
  type: 'mcq' | 'theory';
  body: string;
  image_url: string | null;
  marks: number;
  passage: { id: string; title: string; body: string } | null;
  options: PaperOption[];
}

export interface PaperSection {
  id: string;
  title: string;
  instructions: string | null;
  questions: PaperQuestion[];
}

export interface SavedAnswer {
  option_id: string | null;
  text: string | null;
}

export interface Paper {
  attempt_id: string;
  status: 'in_progress' | 'submitted';
  deadline_at: string;
  server_now: string;
  answers: Record<string, SavedAnswer>;
  exam: { id: string; title: string; instructions: string | null; duration_minutes: number; calculator: boolean; lockdown: boolean };
  sections: PaperSection[];
}

export interface MyExam {
  exam_id: string;
  title: string;
  kind: ExamKind;
  subject: string | null;
  duration_minutes: number;
  opens_at: string | null;
  closes_at: string | null;
  max_attempts: number | null;
  attempts_used: number;
  in_progress_attempt: string | null;
  last_submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  results_released: boolean;
  review_allowed: boolean;
  last_attempt_id: string | null;
  instructions: string | null;
  lockdown: boolean;
  calculator: boolean;
  status: ExamStatus;
}

export interface MonitorRow {
  candidate_id: string;
  name: string;
  login_id: string | null;
  attempt_id: string | null;
  status: 'not_started' | 'in_progress' | 'submitted';
  answered: number;
  total: number;
  started_at: string | null;
  deadline_at: string | null;
  last_seen_at: string | null;
  warnings: number;
  score: number | null;
  max_score: number | null;
}

export interface Review {
  exam: { id: string; title: string };
  score: number;
  max_score: number;
  needs_marking: boolean;
  sections: PaperSection[];
  key: Record<string, string>;
  explanations: Record<string, string>;
  answers: Record<string, { option_id: string | null; text: string | null; marks: number | null; comment: string | null }>;
}

/** Whether a published exam's window is open now. */
export function windowState(exam: Pick<Exam, 'opens_at' | 'closes_at'>, now = Date.now()): 'upcoming' | 'open' | 'closed' {
  if (exam.opens_at && now < Date.parse(exam.opens_at)) return 'upcoming';
  if (exam.closes_at && now >= Date.parse(exam.closes_at)) return 'closed';
  return 'open';
}

export const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '';
