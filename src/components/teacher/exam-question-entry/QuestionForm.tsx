
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Exam } from '../../../contexts/ExamContext';

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

interface QuestionFormProps {
  exam: Exam;
  nextQuestionNumber: number;
  onAddQuestion: (questionData: any) => void;
}

export const QuestionForm = ({ exam, nextQuestionNumber, onAddQuestion }: QuestionFormProps) => {
  const [newQuestion, setNewQuestion] = useState<QuestionData>({
    questionNumber: nextQuestionNumber,
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

    onAddQuestion(questionData);

    toast({
      title: "Question Added",
      description: `Question ${newQuestion.questionNumber} has been added to ${exam.title}`,
    });

    // Reset form and increment question number
    setNewQuestion({
      questionNumber: nextQuestionNumber + 1,
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

  return (
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
  );
};
