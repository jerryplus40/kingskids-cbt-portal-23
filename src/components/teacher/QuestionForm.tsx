import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';

interface QuestionFormData {
  questionNumber: number;
  question: string;
  subject: string;
  class: string;
  difficulty: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
}

interface QuestionFormProps {
  onCreateQuestion: (questionData: any) => void;
  onCancel: () => void;
}

export const QuestionForm = ({ onCreateQuestion, onCancel }: QuestionFormProps) => {
  const [newQuestion, setNewQuestion] = useState<QuestionFormData>({
    questionNumber: 1,
    question: '',
    subject: '',
    class: '',
    difficulty: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctAnswer: ''
  });

  const handleCreateQuestion = () => {
    if (!newQuestion.question || !newQuestion.subject || !newQuestion.class || !newQuestion.difficulty || 
        !newQuestion.optionA || !newQuestion.optionB || !newQuestion.optionC || 
        !newQuestion.optionD || !newQuestion.optionE || !newQuestion.correctAnswer) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including all 5 options",
        variant: "destructive"
      });
      return;
    }

    onCreateQuestion({
      questionNumber: newQuestion.questionNumber,
      question: newQuestion.question,
      subject: newQuestion.subject,
      class: newQuestion.class,
      difficulty: newQuestion.difficulty as 'Easy' | 'Medium' | 'Hard',
      optionA: newQuestion.optionA,
      optionB: newQuestion.optionB,
      optionC: newQuestion.optionC,
      optionD: newQuestion.optionD,
      optionE: newQuestion.optionE,
      correctAnswer: newQuestion.correctAnswer as 'A' | 'B' | 'C' | 'D' | 'E',
      type: 'Multiple Choice'
    });

    toast({
      title: "Question Created",
      description: "Question has been added to your question bank",
    });

    setNewQuestion({
      questionNumber: 1,
      question: '',
      subject: '',
      class: '',
      difficulty: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      optionE: '',
      correctAnswer: ''
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Question</CardTitle>
        <CardDescription>Add a multiple choice question with options A through E</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="questionNumber">Question Number *</Label>
              <Input
                id="questionNumber"
                type="number"
                min="1"
                max="60"
                value={newQuestion.questionNumber}
                onChange={(e) => setNewQuestion({...newQuestion, questionNumber: parseInt(e.target.value) || 1})}
              />
            </div>
            <div>
              <Label htmlFor="questionSubject">Subject *</Label>
              <Select value={newQuestion.subject} onValueChange={(value) => setNewQuestion({...newQuestion, subject: value})}>
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
              <Label htmlFor="questionClass">Class *</Label>
              <Select value={newQuestion.class} onValueChange={(value) => setNewQuestion({...newQuestion, class: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SS1A">SS1A</SelectItem>
                  <SelectItem value="SS1B">SS1B</SelectItem>
                  <SelectItem value="SS2A">SS2A</SelectItem>
                  <SelectItem value="SS2B">SS2B</SelectItem>
                  <SelectItem value="SS3A">SS3A</SelectItem>
                  <SelectItem value="SS3B">SS3B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Select value={newQuestion.difficulty} onValueChange={(value) => setNewQuestion({...newQuestion, difficulty: value})}>
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
          
          <div>
            <Label htmlFor="questionText">Question *</Label>
            <Textarea
              id="questionText"
              value={newQuestion.question}
              onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
              placeholder="Enter your question here..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="optionA">Option A *</Label>
              <Input
                id="optionA"
                value={newQuestion.optionA}
                onChange={(e) => setNewQuestion({...newQuestion, optionA: e.target.value})}
                placeholder="Enter option A"
              />
            </div>
            <div>
              <Label htmlFor="optionB">Option B *</Label>
              <Input
                id="optionB"
                value={newQuestion.optionB}
                onChange={(e) => setNewQuestion({...newQuestion, optionB: e.target.value})}
                placeholder="Enter option B"
              />
            </div>
            <div>
              <Label htmlFor="optionC">Option C *</Label>
              <Input
                id="optionC"
                value={newQuestion.optionC}
                onChange={(e) => setNewQuestion({...newQuestion, optionC: e.target.value})}
                placeholder="Enter option C"
              />
            </div>
            <div>
              <Label htmlFor="optionD">Option D *</Label>
              <Input
                id="optionD"
                value={newQuestion.optionD}
                onChange={(e) => setNewQuestion({...newQuestion, optionD: e.target.value})}
                placeholder="Enter option D"
              />
            </div>
            <div>
              <Label htmlFor="optionE">Option E *</Label>
              <Input
                id="optionE"
                value={newQuestion.optionE}
                onChange={(e) => setNewQuestion({...newQuestion, optionE: e.target.value})}
                placeholder="Enter option E"
              />
            </div>
          </div>

          <div>
            <Label>Correct Answer *</Label>
            <RadioGroup 
              value={newQuestion.correctAnswer} 
              onValueChange={(value) => setNewQuestion({...newQuestion, correctAnswer: value})}
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

          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateQuestion} className="bg-blue-600 hover:bg-blue-700">
              Add Question
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
