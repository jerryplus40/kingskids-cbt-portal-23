export interface TermScore {
  student_id: string;
  term_id: string;
  subject_id: string;
  class_id: string | null;
  ca_score: number | null;
  exam_score: number | null;
  updated_at: string;
}

export interface BroadsheetRow {
  student_id: string;
  student_name: string;
  admission_no: string;
  subject_id: string;
  subject: string;
  ca_score: number | null;
  exam_score: number | null;
  total: number;
  grade: string | null;
  remark: string | null;
  subject_position: number;
  subject_average: number;
  subject_highest: number;
  subject_lowest: number;
}

export interface ReportComment {
  student_id: string;
  term_id: string;
  class_teacher_comment: string | null;
  principal_comment: string | null;
  days_present: number | null;
  days_open: number | null;
  traits: Record<string, number>;
}

export interface GradeBand {
  id: string;
  min_score: number;
  max_score: number;
  grade: string;
  remark: string;
}

export interface ReportCardData {
  released: boolean;
  school: {
    school_name: string;
    address: string | null;
    motto: string | null;
    phone: string | null;
    email: string | null;
    logo_url: string | null;
    ca_weight: number;
    exam_weight: number;
  };
  term: { id: string; term: number; session: string; starts_on: string | null; ends_on: string | null; next_term_begins: string | null };
  student: { id: string; name: string; admission_no: string; gender: string | null; date_of_birth: string | null; photo_url: string | null };
  class: { id: string; name: string; class_teacher: string | null } | null;
  subjects: {
    subject: string;
    ca: number | null;
    exam: number | null;
    total: number;
    grade: string | null;
    remark: string | null;
    position: number;
    out_of: number;
    class_average: number;
    highest: number;
    lowest: number;
    teacher: string | null;
  }[];
  overall: { subjects: number; grand_total: number; average: number; position: number; class_size: number; grade: string | null } | null;
  comments: Omit<ReportComment, 'student_id' | 'term_id'> | null;
  grade_scale: { grade: string; min: number; max: number; remark: string }[];
}

/** Affective and psychomotor traits rated 1–5 on Nigerian report cards. */
export const TRAITS = ['Punctuality', 'Attendance', 'Neatness', 'Politeness', 'Honesty', 'Self-control', 'Relationship with others', 'Handwriting', 'Sports and games', 'Creativity'];

export const ordinal = (n: number) => {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
};
