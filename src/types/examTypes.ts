
export interface Question {
  id: string;
  questionNumber: number;
  question: string;
  subject: string;
  class: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  type: string;
  examId?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  class?: string;
  questions: number;
  duration: number;
  students?: number;
  submitted?: number;
  deadline: string;
  status: 'active' | 'completed' | 'draft' | 'available' | 'expired';
  totalMarks?: string;
  instructions?: string;
  attempts?: number;
  maxAttempts?: number;
}

export interface ExamContextType {
  exams: Exam[];
  questions: Question[];
  addExam: (exam: Omit<Exam, 'id'>) => Exam;
  addQuestion: (question: Omit<Question, 'id'>) => void;
  addExamQuestion: (question: Omit<Question, 'id'>) => void;
  addBulkQuestions: (questions: Omit<Question, 'id'>[]) => void;
  deleteExam: (id: string) => void;
  deleteQuestion: (id: string) => void;
  deleteExamQuestion: (id: string) => void;
  getQuestionsByClass: (className: string) => Question[];
  getExamQuestions: (examId: string) => Question[];
  getExamsByClass: (className: string) => Exam[];
  updateExamQuestionCount: (examId: string) => void;
}
