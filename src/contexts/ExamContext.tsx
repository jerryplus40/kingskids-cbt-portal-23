
import { createContext } from 'react';
import { ExamContextType } from '../types/examTypes';

export const ExamContext = createContext<ExamContextType | undefined>(undefined);

// Re-export everything for backward compatibility
export * from '../types/examTypes';
export * from './ExamProvider';
export * from '../hooks/useExam';
