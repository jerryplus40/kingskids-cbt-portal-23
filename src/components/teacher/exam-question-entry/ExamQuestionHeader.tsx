
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Exam } from '../../../contexts/ExamContext';

interface ExamQuestionHeaderProps {
  exam: Exam;
  questionCount: number;
  onClose: () => void;
}

export const ExamQuestionHeader = ({ exam, questionCount, onClose }: ExamQuestionHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-gray-600">Subject: {exam.subject} | Duration: {exam.duration} minutes</p>
        </div>
      </div>
      <Badge variant="outline" className="text-lg px-3 py-1">
        {questionCount} Questions Added
      </Badge>
    </div>
  );
};
