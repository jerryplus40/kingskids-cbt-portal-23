
import { Exam, Question } from '../types/examTypes';

export const initialExams: Exam[] = [
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
];

export const initialQuestions: Question[] = [
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
];
