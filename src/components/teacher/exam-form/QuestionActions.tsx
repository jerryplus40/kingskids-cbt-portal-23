
import { Button } from '@/components/ui/button';
import { Save, Plus } from 'lucide-react';

interface QuestionActionsProps {
  questionCount: number;
  onBackToDetails: () => void;
  onSaveExam: () => void;
  onCancel: () => void;
  onAddFirstQuestion: () => void;
}

export const QuestionActions = ({ 
  questionCount, 
  onBackToDetails, 
  onSaveExam, 
  onCancel, 
  onAddFirstQuestion 
}: QuestionActionsProps) => {
  if (questionCount === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No questions added yet</p>
        <Button onClick={onAddFirstQuestion} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Your First Question
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 pt-4 border-t">
      <Button onClick={onBackToDetails} variant="outline">
        Back to Exam Details
      </Button>
      <Button onClick={onSaveExam} className="bg-green-600 hover:bg-green-700" disabled={questionCount === 0}>
        <Save className="h-4 w-4 mr-2" />
        Save Exam ({questionCount} questions)
      </Button>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
};
