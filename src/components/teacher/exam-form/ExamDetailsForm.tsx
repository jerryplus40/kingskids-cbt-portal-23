
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface ExamDetailsFormProps {
  examData: ExamFormData;
  setExamData: (data: ExamFormData) => void;
  onNext: () => void;
  onCancel: () => void;
}

export const ExamDetailsForm = ({ examData, setExamData, onNext, onCancel }: ExamDetailsFormProps) => {
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
            <Label htmlFor="marksPerQuestion">Marks Per Question *</Label>
            <Input
              id="marksPerQuestion"
              type="number"
              value={examData.marksPerQuestion}
              onChange={(e) => setExamData({...examData, marksPerQuestion: e.target.value})}
              placeholder="5"
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
          <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
            Next: Add Questions
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
