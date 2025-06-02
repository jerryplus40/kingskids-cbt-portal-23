
import React, { useState, ReactNode } from 'react';
import { ExamContext } from './ExamContext';
import { Exam, Question, ExamContextType } from '../types/examTypes';
import { initialExams, initialQuestions } from '../data/mockData';

export const ExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [exams, setExams] = useState<Exam[]>(initialExams);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  const addExam = (examData: Omit<Exam, 'id'>): Exam => {
    const newExam: Exam = {
      ...examData,
      id: Date.now().toString(),
      status: 'available',
      attempts: 0,
      maxAttempts: 1,
      students: 25,
      submitted: 0,
      questions: 0
    };
    setExams(prev => [...prev, newExam]);
    return newExam;
  };

  const addQuestion = (questionData: Omit<Question, 'id'>) => {
    const newQuestion: Question = {
      ...questionData,
      id: Date.now().toString(),
      type: 'Multiple Choice'
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const addExamQuestion = (questionData: Omit<Question, 'id'>) => {
    const newQuestion: Question = {
      ...questionData,
      id: `${Date.now()}-${Math.random()}`,
      type: 'Multiple Choice'
    };
    setQuestions(prev => [...prev, newQuestion]);
    
    if (questionData.examId) {
      updateExamQuestionCount(questionData.examId);
    }
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
    setQuestions(prev => prev.filter(question => question.examId !== id));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(question => question.id !== id));
  };

  const deleteExamQuestion = (id: string) => {
    const questionToDelete = questions.find(q => q.id === id);
    setQuestions(prev => prev.filter(question => question.id !== id));
    
    if (questionToDelete?.examId) {
      updateExamQuestionCount(questionToDelete.examId);
    }
  };

  const getQuestionsByClass = (className: string) => {
    return questions.filter(question => question.class === className);
  };

  const getExamQuestions = (examId: string) => {
    return questions.filter(question => question.examId === examId);
  };

  const getExamsByClass = (className: string) => {
    return exams.filter(exam => exam.class === className && (exam.status === 'available' || exam.status === 'active'));
  };

  const updateExamQuestionCount = (examId: string) => {
    setExams(prev => prev.map(exam => {
      if (exam.id === examId) {
        const examQuestions = questions.filter(q => q.examId === examId);
        return { ...exam, questions: examQuestions.length };
      }
      return exam;
    }));
  };

  const contextValue: ExamContextType = {
    exams,
    questions,
    addExam,
    addQuestion,
    addExamQuestion,
    addBulkQuestions,
    deleteExam,
    deleteQuestion,
    deleteExamQuestion,
    getQuestionsByClass,
    getExamQuestions,
    getExamsByClass,
    updateExamQuestionCount
  };

  return (
    <ExamContext.Provider value={contextValue}>
      {children}
    </ExamContext.Provider>
  );
};
