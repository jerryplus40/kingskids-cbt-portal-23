
import { useContext } from 'react';
import { ExamContext } from '../contexts/ExamContext';
import { ExamContextType } from '../types/examTypes';

export const useExam = (): ExamContextType => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};
