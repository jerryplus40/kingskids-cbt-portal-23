
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2 } from 'lucide-react';

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

interface QuestionEditorProps {
  question: QuestionData;
  onUpdate: (field: keyof QuestionData, value: string) => void;
  onRemove?: () => void;
  canRemove: boolean;
}

export const QuestionEditor = ({ question, onUpdate, onRemove, canRemove }: QuestionEditorProps) => {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Question {question.questionNumber}</h3>
        <div className="flex items-center space-x-2">
          <Label>Difficulty:</Label>
          <Select 
            value={question.difficulty} 
            onValueChange={(value: 'Easy' | 'Medium' | 'Hard') => onUpdate('difficulty', value)}
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
          {canRemove && onRemove && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRemove}
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
          value={question.question}
          onChange={(e) => onUpdate('question', e.target.value)}
          placeholder="Enter your question here..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {(['A', 'B', 'C', 'D', 'E'] as const).map((option) => (
          <div key={option}>
            <Label>Option {option} *</Label>
            <Input
              value={question[`option${option}` as keyof QuestionData] as string}
              onChange={(e) => onUpdate(`option${option}` as keyof QuestionData, e.target.value)}
              placeholder={`Enter option ${option}`}
            />
          </div>
        ))}
      </div>

      <div>
        <Label>Correct Answer *</Label>
        <RadioGroup 
          value={question.correctAnswer} 
          onValueChange={(value: 'A' | 'B' | 'C' | 'D' | 'E') => onUpdate('correctAnswer', value)}
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
  );
};
