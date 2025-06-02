
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Save, ArrowLeft } from 'lucide-react';
import { Exam } from '../../contexts/ExamContext';

interface BulkQuestionData {
  questionNumber: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
}

interface ExamBulkQuestionFormProps {
  exam: Exam;
  onCreateBulkQuestions: (questionsData: any[]) => void;
  onCancel: () => void;
}

export const ExamBulkQuestionForm = ({ exam, onCreateBulkQuestions, onCancel }: ExamBulkQuestionFormProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState<BulkQuestionData[]>(
    Array.from({ length: 60 }, (_, index) => ({
      questionNumber: index + 1,
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      optionE: '',
      correctAnswer: ''
    }))
  );

  const currentQuestion = questions[currentQuestionIndex];

  const updateCurrentQuestion = (field: keyof BulkQuestionData, value: string) => {
    setQuestions(prev => prev.map((q, index) => 
      index === currentQuestionIndex ? { ...q, [field]: value } : q
    ));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < 59) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSaveAll = () => {
    if (!difficulty) {
      toast({
        title: "Missing Information",
        description: "Please select difficulty level",
        variant: "destructive"
      });
      return;
    }

    const filledQuestions = questions.filter(q => 
      q.question && q.optionA && q.optionB && q.optionC && q.optionD && q.optionE && q.correctAnswer
    );

    if (filledQuestions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please add at least one complete question",
        variant: "destructive"
      });
      return;
    }

    const questionsData = filledQuestions.map(q => ({
      questionNumber: q.questionNumber,
      question: q.question,
      subject: exam.subject,
      class: exam.class,
      difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      optionE: q.optionE,
      correctAnswer: q.correctAnswer as 'A' | 'B' | 'C' | 'D' | 'E',
      type: 'Multiple Choice',
      examId: exam.id
    }));

    onCreateBulkQuestions(questionsData);

    toast({
      title: "Questions Added to Exam",
      description: `${filledQuestions.length} questions have been added to ${exam.title}`,
    });
  };

  const isQuestionComplete = (q: BulkQuestionData) => {
    return q.question && q.optionA && q.optionB && q.optionC && q.optionD && q.optionE && q.correctAnswer;
  };

  const completedCount = questions.filter(isQuestionComplete).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Add Questions to {exam.title}</CardTitle>
            <CardDescription>
              Subject: {exam.subject} | Class: {exam.class} | Add up to 60 questions for this exam
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Difficulty Setting */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="difficulty">Difficulty Level *</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-48">
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

          {/* Question Navigation */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="font-semibold">
                Question {currentQuestionIndex + 1} of 60
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNext}
                disabled={currentQuestionIndex === 59}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Completed: {completedCount}/60
            </div>
          </div>

          {/* Current Question Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="questionText">Question {currentQuestionIndex + 1} *</Label>
              <Textarea
                id="questionText"
                value={currentQuestion.question}
                onChange={(e) => updateCurrentQuestion('question', e.target.value)}
                placeholder={`Enter question ${currentQuestionIndex + 1} here...`}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="optionA">Option A *</Label>
                <Input
                  id="optionA"
                  value={currentQuestion.optionA}
                  onChange={(e) => updateCurrentQuestion('optionA', e.target.value)}
                  placeholder="Enter option A"
                />
              </div>
              <div>
                <Label htmlFor="optionB">Option B *</Label>
                <Input
                  id="optionB"
                  value={currentQuestion.optionB}
                  onChange={(e) => updateCurrentQuestion('optionB', e.target.value)}
                  placeholder="Enter option B"
                />
              </div>
              <div>
                <Label htmlFor="optionC">Option C *</Label>
                <Input
                  id="optionC"
                  value={currentQuestion.optionC}
                  onChange={(e) => updateCurrentQuestion('optionC', e.target.value)}
                  placeholder="Enter option C"
                />
              </div>
              <div>
                <Label htmlFor="optionD">Option D *</Label>
                <Input
                  id="optionD"
                  value={currentQuestion.optionD}
                  onChange={(e) => updateCurrentQuestion('optionD', e.target.value)}
                  placeholder="Enter option D"
                />
              </div>
              <div>
                <Label htmlFor="optionE">Option E *</Label>
                <Input
                  id="optionE"
                  value={currentQuestion.optionE}
                  onChange={(e) => updateCurrentQuestion('optionE', e.target.value)}
                  placeholder="Enter option E"
                />
              </div>
            </div>

            <div>
              <Label>Correct Answer *</Label>
              <RadioGroup 
                value={currentQuestion.correctAnswer} 
                onValueChange={(value) => updateCurrentQuestion('correctAnswer', value)}
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
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveAll} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Add All Questions to Exam ({completedCount})
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
