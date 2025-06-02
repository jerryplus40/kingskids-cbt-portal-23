
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ExamDetailsForm } from './exam-form/ExamDetailsForm';
import { QuestionsStep } from './exam-form/QuestionsStep';

interface ExamFormData {
  subject: string;
  title: string;
  class: string;
  duration: string;
  totalMarks: string;
  marksPerQuestion: string;
  instructions: string;
  deadline: string;
}

interface ExamFormProps {
  onCreateExam: (examData: any) => void;
  onCancel: () => void;
}

export const ExamForm = ({ onCreateExam, onCancel }: ExamFormProps) => {
  const [step, setStep] = useState<'exam-details' | 'questions'>('exam-details');
  const [examData, setExamData] = useState<ExamFormData>({
    subject: '',
    title: '',
    class: '',
    duration: '',
    totalMarks: '',
    marksPerQuestion: '',
    instructions: '',
    deadline: ''
  });

  const handleExamDetailsSubmit = () => {
    if (!examData.subject || !examData.title || !examData.class || !examData.duration || !examData.marksPerQuestion) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including marks per question",
        variant: "destructive"
      });
      return;
    }
    setStep('questions');
  };

  const handleSaveExam = (completeExamData: any) => {
    onCreateExam(completeExamData);
  };

  if (step === 'exam-details') {
    return (
      <ExamDetailsForm
        examData={examData}
        setExamData={setExamData}
        onNext={handleExamDetailsSubmit}
        onCancel={onCancel}
      />
    );
  }

  return (
    <QuestionsStep
      examData={examData}
      onBackToDetails={() => setStep('exam-details')}
      onSaveExam={handleSaveExam}
      onCancel={onCancel}
    />
  );
};
