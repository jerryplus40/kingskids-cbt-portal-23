
import React, { createContext, useContext, useState, ReactNode } from 'react';

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

interface ExamContextType {
  exams: Exam[];
  questions: Question[];
  addExam: (exam: Omit<Exam, 'id'>) => void;
  addQuestion: (question: Omit<Question, 'id'>) => void;
  addBulkQuestions: (questions: Omit<Question, 'id'>[]) => void;
  deleteExam: (id: string) => void;
  deleteQuestion: (id: string) => void;
  getQuestionsByClass: (className: string) => Question[];
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};

export const ExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [exams, setExams] = useState<Exam[]>([
    { 
      id: '1', 
      title: 'Mathematics Mid-Term', 
      subject: 'Mathematics',
      class: 'SS1A',
      questions: 50, 
      duration: 90, 
      students: 25,
      submitted: 18,
      deadline: '2024-06-15',
      status: 'active',
      attempts: 0,
      maxAttempts: 1
    },
    { 
      id: '2', 
      title: 'Algebra Basics', 
      subject: 'Mathematics',
      class: 'SS1B',
      questions: 30, 
      duration: 60, 
      students: 22,
      submitted: 22,
      deadline: '2024-06-10',
      status: 'completed',
      attempts: 0,
      maxAttempts: 1
    },
  ]);

  const [questions, setQuestions] = useState<Question[]>([
    { 
      id: '1', 
      questionNumber: 1,
      question: 'What is 2 + 2?', 
      subject: 'Mathematics', 
      class: 'SS1A',
      difficulty: 'Easy', 
      type: 'Multiple Choice',
      optionA: '3',
      optionB: '4',
      optionC: '5',
      optionD: '6',
      optionE: '7',
      correctAnswer: 'B'
    },
    { 
      id: '2', 
      questionNumber: 2,
      question: 'Solve for x: 2x + 5 = 13', 
      subject: 'Mathematics', 
      class: 'SS1A',
      difficulty: 'Medium', 
      type: 'Multiple Choice',
      optionA: 'x = 3',
      optionB: 'x = 4',
      optionC: 'x = 5',
      optionD: 'x = 6',
      optionE: 'x = 7',
      correctAnswer: 'B'
    },
    { 
      id: '3', 
      questionNumber: 1,
      question: 'Find the derivative of x²', 
      subject: 'Mathematics', 
      class: 'SS1B',
      difficulty: 'Hard', 
      type: 'Multiple Choice',
      optionA: '2x',
      optionB: 'x',
      optionC: '2',
      optionD: 'x²',
      optionE: '1',
      correctAnswer: 'A'
    },
  ]);

  const addExam = (examData: Omit<Exam, 'id'>) => {
    const newExam: Exam = {
      ...examData,
      id: Date.now().toString(),
      status: 'available',
      attempts: 0,
      maxAttempts: 1,
      students: 25,
      submitted: 0
    };
    setExams(prev => [...prev, newExam]);
  };

  const addQuestion = (questionData: Omit<Question, 'id'>) => {
    const newQuestion: Question = {
      ...questionData,
      id: Date.now().toString(),
      type: 'Multiple Choice'
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const addBulkQuestions = (questionsData: Omit<Question, 'id'>[]) => {
    const newQuestions: Question[] = questionsData.map((questionData, index) => ({
      ...questionData,
      id: `${Date.now()}-${index}`,
      type: 'Multiple Choice'
    }));
    setQuestions(prev => [...prev, ...newQuestions]);
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(exam => exam.id !== id));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(question => question.id !== id));
  };

  const getQuestionsByClass = (className: string) => {
    return questions.filter(question => question.class === className);
  };

  return (
    <ExamContext.Provider value={{
      exams,
      questions,
      addExam,
      addQuestion,
      addBulkQuestions,
      deleteExam,
      deleteQuestion,
      getQuestionsByClass
    }}>
      {children}
    </ExamContext.Provider>
  );
};
