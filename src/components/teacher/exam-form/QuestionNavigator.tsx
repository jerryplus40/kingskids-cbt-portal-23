
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface QuestionNavigatorProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  completedCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onAddQuestion: () => void;
}

export const QuestionNavigator = ({ 
  currentQuestionIndex, 
  totalQuestions, 
  completedCount, 
  onPrevious, 
  onNext, 
  onAddQuestion 
}: QuestionNavigatorProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="font-semibold">
          {totalQuestions > 0 ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}` : 'No questions yet'}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNext}
          disabled={currentQuestionIndex >= totalQuestions - 1}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">
          Completed: {completedCount}/{totalQuestions}
        </span>
        <Button onClick={onAddQuestion} size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-1" />
          Add Question
        </Button>
      </div>
    </div>
  );
};
