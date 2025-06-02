
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { Question } from '../../../contexts/ExamContext';

interface ExamQuestionsListProps {
  questions: Question[];
  onDeleteQuestion: (questionId: string) => void;
}

export const ExamQuestionsList = ({ questions, onDeleteQuestion }: ExamQuestionsListProps) => {
  if (questions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions in this Exam ({questions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Q{question.questionNumber}</Badge>
                  <Badge variant={question.difficulty === 'Easy' ? 'default' : question.difficulty === 'Medium' ? 'secondary' : 'destructive'}>
                    {question.difficulty}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDeleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="font-medium mb-2">{question.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
                <div className={`p-2 rounded ${question.correctAnswer === 'A' ? 'bg-green-100' : 'bg-gray-50'}`}>
                  A. {question.optionA}
                </div>
                <div className={`p-2 rounded ${question.correctAnswer === 'B' ? 'bg-green-100' : 'bg-gray-50'}`}>
                  B. {question.optionB}
                </div>
                <div className={`p-2 rounded ${question.correctAnswer === 'C' ? 'bg-green-100' : 'bg-gray-50'}`}>
                  C. {question.optionC}
                </div>
                <div className={`p-2 rounded ${question.correctAnswer === 'D' ? 'bg-green-100' : 'bg-gray-50'}`}>
                  D. {question.optionD}
                </div>
                <div className={`p-2 rounded ${question.correctAnswer === 'E' ? 'bg-green-100' : 'bg-gray-50'}`}>
                  E. {question.optionE}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
