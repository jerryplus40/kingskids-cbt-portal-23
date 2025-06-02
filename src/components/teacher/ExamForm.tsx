
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface ExamFormProps {
  onCreateExam: (examData: any) => void;
  onCancel: () => void;
}

export const ExamForm = ({ onCreateExam, onCancel }: ExamFormProps) => {
  const [step, setStep] = useState<'exam-details' | 'questions'>('exam-details');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examData, setExamData] = useState<ExamFormData>({
    subject: '',
    title: '',
    class: '',
    duration: '',
    totalMarks: '',
    instructions: '',
    deadline: ''
  });
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
    // Renumber questions
    const renumberedQuestions = updatedQuestions.map((q, i) => ({
      ...q,
      questionNumber: i + 1
    }));
    setQuestions(renumberedQuestions);
    if (currentQuestionIndex >= renumberedQuestions.length && renumberedQuestions.length > 0) {
      setCurrentQuestionIndex(renumberedQuestions.length - 1);
    }
  };

  const handleExamDetailsSubmit = () => {
    if (!examData.subject || !examData.title || !examData.class || !examData.duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setStep('questions');
    if (questions.length === 0) {
      addNewQuestion();
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

    onCreateExam(completeExamData);

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

  if (step === 'exam-details') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create New Exam - Step 1: Exam Details</CardTitle>
          <CardDescription>Fill in the basic exam information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={examData.subject} onValueChange={(value) => setExamData({...examData, subject: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English">English Language</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                value={examData.title}
                onChange={(e) => setExamData({...examData, title: e.target.value})}
                placeholder="e.g., Mid-Term Examination"
              />
            </div>
            <div>
              <Label htmlFor="class">Class *</Label>
              <Select value={examData.class} onValueChange={(value) => setExamData({...examData, class: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SS1A">SS1A</SelectItem>
                  <SelectItem value="SS1B">SS1B</SelectItem>
                  <SelectItem value="SS1C">SS1C</SelectItem>
                  <SelectItem value="SS2A">SS2A</SelectItem>
                  <SelectItem value="SS2B">SS2B</SelectItem>
                  <SelectItem value="SS2C">SS2C</SelectItem>
                  <SelectItem value="SS3A">SS3A</SelectItem>
                  <SelectItem value="SS3B">SS3B</SelectItem>
                  <SelectItem value="SS3C">SS3C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                value={examData.duration}
                onChange={(e) => setExamData({...examData, duration: e.target.value})}
                placeholder="90"
              />
            </div>
            <div>
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input
                id="totalMarks"
                type="number"
                value={examData.totalMarks}
                onChange={(e) => setExamData({...examData, totalMarks: e.target.value})}
                placeholder="100"
              />
            </div>
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={examData.deadline}
                onChange={(e) => setExamData({...examData, deadline: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={examData.instructions}
              onChange={(e) => setExamData({...examData, instructions: e.target.value})}
              placeholder="Enter exam instructions..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 mt-6">
            <Button onClick={handleExamDetailsSubmit} className="bg-blue-600 hover:bg-blue-700">
              Next: Add Questions
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          {/* Question Management */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="font-semibold">
                {questions.length > 0 ? `Question ${currentQuestionIndex + 1} of ${questions.length}` : 'No questions yet'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                disabled={currentQuestionIndex >= questions.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Completed: {completedCount}/{questions.length}
              </span>
              <Button onClick={addNewQuestion} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            </div>
          </div>

          {/* Current Question Form */}
          {currentQuestion && (
            <div className="space-y-4 p-6 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Question {currentQuestion.questionNumber}</h3>
                <div className="flex items-center space-x-2">
                  <Label>Difficulty:</Label>
                  <Select 
                    value={currentQuestion.difficulty} 
                    onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => updateQuestion(currentQuestionIndex, 'difficulty', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  {questions.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeQuestion(currentQuestionIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label>Question *</Label>
                <Textarea
                  value={currentQuestion.question}
                  onChange={(e) => updateQuestion(currentQuestionIndex, 'question', e.target.value)}
                  placeholder="Enter your question here..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {(['A', 'B', 'C', 'D', 'E'] as const).map((option) => (
                  <div key={option}>
                    <Label>Option {option} *</Label>
                    <Input
                      value={currentQuestion[`option${option}` as keyof QuestionData] as string}
                      onChange={(e) => updateQuestion(currentQuestionIndex, `option${option}` as keyof QuestionData, e.target.value)}
                      placeholder={`Enter option ${option}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Correct Answer *</Label>
                <RadioGroup 
                  value={currentQuestion.correctAnswer} 
                  onValueChange={(value: 'A' | 'B' | 'C' | 'D' | 'E') => updateQuestion(currentQuestionIndex, 'correctAnswer', value)}
                  className="flex space-x-6 mt-2"
                >
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`correct${option}`} />
                      <Label htmlFor={`correct${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {questions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No questions added yet</p>
              <Button onClick={addNewQuestion} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Question
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={() => setStep('exam-details')} variant="outline">
              Back to Exam Details
            </Button>
            <Button onClick={handleSaveExam} className="bg-green-600 hover:bg-green-700" disabled={questions.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              Save Exam ({questions.length} questions)
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
