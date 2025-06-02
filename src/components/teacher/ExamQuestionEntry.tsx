import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useExam } from '../../contexts/ExamContext';
import { Exam, Question } from '../../contexts/ExamContext';

interface ExamQuestionEntryProps {
  exam: Exam;
  onClose: () => void;
}

interface QuestionData {
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

export const ExamQuestionEntry = ({ exam, onClose }: ExamQuestionEntryProps) => {
  const { addExamQuestion, getExamQuestions, deleteExamQuestion } = useExam();
  const examQuestions = getExamQuestions(exam.id);
  
  const [newQuestion, setNewQuestion] = useState<QuestionData>({
    questionNumber: examQuestions.length + 1,
    question: '',
    difficulty: 'Medium',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctAnswer: 'A'
  });

  const handleAddQuestion = () => {
    if (!newQuestion.question || !newQuestion.optionA || !newQuestion.optionB || 
        !newQuestion.optionC || !newQuestion.optionD || !newQuestion.optionE) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields including all 5 options",
        variant: "destructive"
      });
      return;
    }

    const questionData = {
      ...newQuestion,
      subject: exam.subject,
      class: exam.class || '',
      examId: exam.id,
      type: 'Multiple Choice'
    };

    addExamQuestion(questionData);

    toast({
      title: "Question Added",
      description: `Question ${newQuestion.questionNumber} has been added to ${exam.title}`,
    });

    // Reset form and increment question number
    setNewQuestion({
      questionNumber: examQuestions.length + 2,
      question: '',
      difficulty: 'Medium',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      optionE: '',
      correctAnswer: 'A'
    });
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
      {/* Header */}
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
          {examQuestions.length} Questions Added
        </Badge>
      </div>

      {/* Add Question Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Question to Exam</CardTitle>
          <CardDescription>Create questions directly for this exam</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionNumber">Question Number</Label>
                <Input
                  id="questionNumber"
                  type="number"
                  min="1"
                  value={newQuestion.questionNumber}
                  onChange={(e) => setNewQuestion({...newQuestion, questionNumber: parseInt(e.target.value) || 1})}
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={newQuestion.difficulty} onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => setNewQuestion({...newQuestion, difficulty: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="questionText">Question</Label>
              <Textarea
                id="questionText"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="optionA">Option A</Label>
                <Input
                  id="optionA"
                  value={newQuestion.optionA}
                  onChange={(e) => setNewQuestion({...newQuestion, optionA: e.target.value})}
                  placeholder="Enter option A"
                />
              </div>
              <div>
                <Label htmlFor="optionB">Option B</Label>
                <Input
                  id="optionB"
                  value={newQuestion.optionB}
                  onChange={(e) => setNewQuestion({...newQuestion, optionB: e.target.value})}
                  placeholder="Enter option B"
                />
              </div>
              <div>
                <Label htmlFor="optionC">Option C</Label>
                <Input
                  id="optionC"
                  value={newQuestion.optionC}
                  onChange={(e) => setNewQuestion({...newQuestion, optionC: e.target.value})}
                  placeholder="Enter option C"
                />
              </div>
              <div>
                <Label htmlFor="optionD">Option D</Label>
                <Input
                  id="optionD"
                  value={newQuestion.optionD}
                  onChange={(e) => setNewQuestion({...newQuestion, optionD: e.target.value})}
                  placeholder="Enter option D"
                />
              </div>
              <div>
                <Label htmlFor="optionE">Option E</Label>
                <Input
                  id="optionE"
                  value={newQuestion.optionE}
                  onChange={(e) => setNewQuestion({...newQuestion, optionE: e.target.value})}
                  placeholder="Enter option E"
                />
              </div>
            </div>

            <div>
              <Label>Correct Answer</Label>
              <RadioGroup 
                value={newQuestion.correctAnswer} 
                onValueChange={(value: 'A' | 'B' | 'C' | 'D' | 'E') => setNewQuestion({...newQuestion, correctAnswer: value})}
                className="flex space-x-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="correctA" />
                  <Label htmlFor="correctA">A</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B" id="correctB" />
                  <Label htmlFor="correctB">B</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="C" id="correctC" />
                  <Label htmlFor="correctC">C</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="D" id="correctD" />
                  <Label htmlFor="correctD">D</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="E" id="correctE" />
                  <Label htmlFor="correctE">E</Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleAddQuestion} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      {examQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions in this Exam ({examQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {examQuestions.map((question, index) => (
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
                      onClick={() => handleDeleteQuestion(question.id)}
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
      )}
    </div>
  );
};
