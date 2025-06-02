
import { useExam } from '../../contexts/ExamContext';
import { Exam } from '../../contexts/ExamContext';
import { ExamQuestionHeader } from './exam-question-entry/ExamQuestionHeader';
import { QuestionForm } from './exam-question-entry/QuestionForm';
import { ExamQuestionsList } from './exam-question-entry/ExamQuestionsList';
import { toast } from '@/hooks/use-toast';

interface ExamQuestionEntryProps {
  exam: Exam;
  onClose: () => void;
}

export const ExamQuestionEntry = ({ exam, onClose }: ExamQuestionEntryProps) => {
  const { addExamQuestion, getExamQuestions, deleteExamQuestion } = useExam();
  const examQuestions = getExamQuestions(exam.id);

  const handleAddQuestion = (questionData: any) => {
    addExamQuestion(questionData);
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteExamQuestion(questionId);
    toast({
      title: "Question Deleted",
      description: "The question has been removed from the exam",
    });
  };

  return (
    <div className="space-y-6">
      <ExamQuestionHeader 
        exam={exam}
        questionCount={examQuestions.length}
        onClose={onClose}
      />

      <QuestionForm 
        exam={exam}
        nextQuestionNumber={examQuestions.length + 1}
        onAddQuestion={handleAddQuestion}
      />

      <ExamQuestionsList 
        questions={examQuestions}
        onDeleteQuestion={handleDeleteQuestion}
      />
    </div>
  );
};
