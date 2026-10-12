export type QuestionType = 'mcq' | 'theory';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'draft' | 'approved';
export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];

export interface QuestionOption {
  id: string;
  question_id: string;
  label: OptionLabel;
  body: string;
  image_url: string | null;
  is_correct: boolean;
}

export interface Passage {
  id: string;
  subject_id: string;
  title: string;
  body: string;
}

export interface Question {
  id: string;
  subject_id: string;
  class_level: string | null;
  topic: string | null;
  difficulty: Difficulty;
  type: QuestionType;
  body: string;
  image_url: string | null;
  passage_id: string | null;
  marks: number;
  explanation: string | null;
  status: QuestionStatus;
  import_id: string | null;
  content_hash: string;
  archived: boolean;
  created_by: string | null;
  created_at: string;
  options: QuestionOption[];
  passage?: Passage | null;
}

/** The shape import_questions() accepts for each row. */
export interface ImportQuestion {
  subject_id: string;
  class_level?: string;
  topic?: string;
  difficulty?: Difficulty;
  type: QuestionType;
  body: string;
  image_url?: string;
  passage_key?: string;
  marks?: number;
  explanation?: string;
  options: { label: OptionLabel; body: string; image_url?: string; is_correct: boolean }[];
  /** Local only: image file names to upload before import */
  imageFile?: string;
  optionImageFiles?: Partial<Record<OptionLabel, string>>;
}

export interface ImportPassage {
  subject_id: string;
  title: string;
  body: string;
}
