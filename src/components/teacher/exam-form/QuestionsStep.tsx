
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { QuestionNavigator } from './QuestionNavigator';
import { QuestionEditor } from './QuestionEditor';
import { QuestionActions } from './QuestionActions';

interface QuestionData {
  id: string;
  questionNumber: number;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
}

interface ExamFormData {
  subject: string;
  title: string;
  class: string;
  duration: string;
  totalMarks: string;
  instructions: string;
  deadline: string;
}

interface QuestionsStepProps {
  examData: ExamFormData;
  onBackToDetails: () => void;
  onSaveExam: (examData: any) => void;
  onCancel: () => void;
}

export const QuestionsStep = ({ examData, onBackToDetails, onSaveExam, onCancel }: QuestionsStepProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuestionData[]>([]);

  const addNewQuestion = () => {
    const newQuestion: QuestionData = {
      id: `q-${Date.now()}`,
      questionNumber: questions.length + 1,
      question: '',
      difficulty: 'Medium',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      optionE: '',
      correctAnswer: 'A'
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const updateQuestion = (index: number, field: keyof QuestionData, value: string) => {
    const updatedQuestions = questions.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    );
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    const renumberedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      questionNumber: i + 1
    }));
    setQuestions(renumberedQuestions);
    if (currentQuestionIndex >= renumberedQuestions.length && renumberedQuestions.length > 0) {
      setCurrentQuestionIndex(renumberedQuestions.length - 1);
    }
  };

  const handleSaveExam = () => {
    if (questions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add at least one question to the exam",
        variant: "destructive"
      });
      return;
    }

    const incompleteQuestions = questions.filter(q => 
      !q.question || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.optionE
    );

    if (incompleteQuestions.length > 0) {
      toast({
        title: "Incomplete Questions",
        description: `Please complete all fields for questions: ${incompleteQuestions.map(q => q.questionNumber).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    const completeExamData = {
      subject: examData.subject,
      title: examData.title,
      class: examData.class,
      duration: parseInt(examData.duration),
      questions: questions.length,
      deadline: examData.deadline,
      totalMarks: examData.totalMarks,
      instructions: examData.instructions,
      status: 'available',
      examQuestions: questions.map(q => ({
        questionNumber: q.questionNumber,
        question: q.question,
        subject: examData.subject,
        class: examData.class,
        difficulty: q.difficulty,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE,
        correctAnswer: q.correctAnswer,
        type: 'Multiple Choice'
      }))
    };

    onSaveExam(completeExamData);

    toast({
      title: "Exam Created Successfully",
      description: `${examData.title} has been created with ${questions.length} questions and is now available to students in ${examData.class}`,
    });
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isQuestionComplete = (q: QuestionData) => {
    return q.question && q.optionA && q.optionB && q.optionC && q.optionD && q.optionE;
  };
  const completedCount = questions.filter(isQuestionComplete).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Exam - Step 2: Add Questions</CardTitle>
        <CardDescription>
          {examData.title} - {examData.subject} - {examData.class}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <QuestionNavigator
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            completedCount={completedCount}
            onPrevious={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            onNext={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            onAddQuestion={addNewQuestion}
          />

          {currentQuestion && (
            <QuestionEditor
              question={currentQuestion}
              onUpdate={(field, value) => updateQuestion(currentQuestionIndex, field, value)}
              onRemove={questions.length > 1 ? () => removeQuestion(currentQuestionIndex) : undefined}
              canRemove={questions.length > 1}
            />
          )}

          <QuestionActions
            questionCount={questions.length}
            onBackToDetails={onBackToDetails}
            onSaveExam={handleSaveExam}
            onCancel={onCancel}
            onAddFirstQuestion={addNewQuestion}
          />
        </div>
      </CardContent>
    </Card>
  );
};
