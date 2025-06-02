
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Download, ArrowLeft } from 'lucide-react';
import { useExam } from '../../contexts/ExamContext';

interface QuestionResult {
  questionNumber: number;
  question: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  studentAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | null;
  isCorrect: boolean;
  marks: number;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
}

interface DetailedResultData {
  studentName: string;
  examTitle: string;
  subject: string;
  totalScore: number;
  totalQuestions: number;
  marksPerQuestion: number;
  submissionTime: string;
  timeSpent: string;
  questions: QuestionResult[];
}

interface DetailedResultViewProps {
  submissionId: string;
  onClose: () => void;
}

export const DetailedResultView = ({ submissionId, onClose }: DetailedResultViewProps) => {
  const { exams } = useExam();
  
  // Mock detailed result data - in a real app, this would come from your backend
  const [resultData] = useState<DetailedResultData>({
    studentName: 'John Doe',
    examTitle: 'Mathematics Mid-Term',
    subject: 'Mathematics',
    totalScore: 17,
    totalQuestions: 20,
    marksPerQuestion: 5,
    submissionTime: '2024-06-02 14:30:00',
    timeSpent: '45 minutes',
    questions: [
      {
        questionNumber: 1,
        question: 'What is the value of x in the equation 2x + 5 = 15?',
        correctAnswer: 'C',
        studentAnswer: 'C',
        isCorrect: true,
        marks: 5,
        options: {
          A: 'x = 3',
          B: 'x = 4', 
          C: 'x = 5',
          D: 'x = 6',
          E: 'x = 7'
        }
      },
      {
        questionNumber: 2,
        question: 'Find the derivative of f(x) = x²',
        correctAnswer: 'B',
        studentAnswer: 'A',
        isCorrect: false,
        marks: 0,
        options: {
          A: 'f\'(x) = x',
          B: 'f\'(x) = 2x',
          C: 'f\'(x) = x²',
          D: 'f\'(x) = 2x²',
          E: 'f\'(x) = 1'
        }
      },
      // Add more mock questions...
      ...Array.from({length: 18}, (_, i) => ({
        questionNumber: i + 3,
        question: `Sample question ${i + 3}`,
        correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D' | 'E',
        studentAnswer: Math.random() > 0.2 ? 'A' as 'A' | 'B' | 'C' | 'D' | 'E' : 'B' as 'A' | 'B' | 'C' | 'D' | 'E',
        isCorrect: Math.random() > 0.2,
        marks: Math.random() > 0.2 ? 5 : 0,
        options: {
          A: 'Option A',
          B: 'Option B', 
          C: 'Option C',
          D: 'Option D',
          E: 'Option E'
        }
      }))
    ]
  });

  const correctAnswers = resultData.questions.filter(q => q.isCorrect).length;
  const wrongAnswers = resultData.questions.filter(q => !q.isCorrect).length;
  const percentage = Math.round((correctAnswers / resultData.totalQuestions) * 100);

  const handleDownloadDetailed = () => {
    const csvData = [
      ['Question No.', 'Question', 'Correct Answer', 'Student Answer', 'Result', 'Marks'],
      ...resultData.questions.map(q => [
        q.questionNumber.toString(),
        q.question,
        q.correctAnswer,
        q.studentAnswer || 'Not Answered',
        q.isCorrect ? 'Correct' : 'Wrong',
        q.marks.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${resultData.studentName}_${resultData.examTitle}_Detailed_Result.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
          <h1 className="text-2xl font-bold">Detailed Result View</h1>
        </div>
        <Button onClick={handleDownloadDetailed} className="bg-green-600 hover:bg-green-700">
          <Download className="h-4 w-4 mr-2" />
          Download Detailed Report
        </Button>
      </div>

      {/* Student Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{resultData.studentName} - {resultData.examTitle}</span>
            <Badge variant={percentage >= 70 ? 'default' : 'destructive'}>
              {percentage}%
            </Badge>
          </CardTitle>
          <CardDescription>{resultData.subject}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
              <p className="text-sm text-gray-600">Correct</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{wrongAnswers}</p>
              <p className="text-sm text-gray-600">Wrong</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{resultData.totalScore}/{resultData.totalQuestions * resultData.marksPerQuestion}</p>
              <p className="text-sm text-gray-600">Total Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{resultData.timeSpent}</p>
              <p className="text-sm text-gray-600">Time Spent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Results */}
      <Card>
        <CardHeader>
          <CardTitle>Question-by-Question Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of each question and student response
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resultData.questions.map((questionResult) => (
              <div 
                key={questionResult.questionNumber}
                className={`p-4 border rounded-lg ${
                  questionResult.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold">Q{questionResult.questionNumber}.</span>
                      {questionResult.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <Badge variant={questionResult.isCorrect ? 'default' : 'destructive'}>
                        {questionResult.marks}/{resultData.marksPerQuestion} marks
                      </Badge>
                    </div>
                    <p className="text-gray-800 mb-3">{questionResult.question}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-sm mb-2">Student Answer:</p>
                    <div className={`p-2 rounded ${
                      questionResult.studentAnswer === questionResult.correctAnswer ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className="font-medium">
                        {questionResult.studentAnswer ? 
                          `${questionResult.studentAnswer}. ${questionResult.options[questionResult.studentAnswer]}` :
                          'Not Answered'
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium text-sm mb-2">Correct Answer:</p>
                    <div className="p-2 rounded bg-green-100">
                      <span className="font-medium text-green-800">
                        {questionResult.correctAnswer}. {questionResult.options[questionResult.correctAnswer]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
