
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Question } from '../../contexts/ExamContext';

interface QuestionListProps {
  questions: Question[];
  onDeleteQuestion: (id: string) => void;
}

export const QuestionList = ({ questions, onDeleteQuestion }: QuestionListProps) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Group questions by class for better organization
  const questionsByClass = questions.reduce((acc, question) => {
    if (!acc[question.class]) {
      acc[question.class] = [];
    }
    acc[question.class].push(question);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="space-y-6">
      {Object.entries(questionsByClass).map(([className, classQuestions]) => (
        <div key={className} className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-600 border-b pb-2">
            Class {className} ({classQuestions.length} questions)
          </h3>
          <div className="space-y-4">
            {classQuestions
              .sort((a, b) => a.questionNumber - b.questionNumber)
              .map((question) => (
                <Card key={question.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="secondary">Q{question.questionNumber}</Badge>
                          <p className="font-medium">{question.question}</p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <Badge variant="outline">{question.subject}</Badge>
                          <Badge variant="outline">{question.class}</Badge>
                          <span className={`font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className="text-gray-600">{question.type}</span>
                          <span className="text-blue-600 font-medium">Answer: {question.correctAnswer}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onDeleteQuestion(question.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No questions created yet.</p>
          <p className="text-sm">Use the bulk question creator to add 1-60 questions at once.</p>
        </div>
      )}
    </div>
  );
};
