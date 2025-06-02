
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

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
  const [newExam, setNewExam] = useState<ExamFormData>({
    subject: '',
    title: '',
    class: '',
    duration: '',
    totalMarks: '',
    instructions: '',
    deadline: ''
  });

  const handleCreateExam = () => {
    if (!newExam.subject || !newExam.title || !newExam.class || !newExam.duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    onCreateExam({
      subject: newExam.subject,
      title: newExam.title,
      class: newExam.class,
      duration: parseInt(newExam.duration),
      questions: 0,
      deadline: newExam.deadline,
      totalMarks: newExam.totalMarks,
      instructions: newExam.instructions,
      status: 'available'
    });

    toast({
      title: "Exam Created",
      description: `${newExam.title} has been created successfully for ${newExam.class} and is now available to students`,
    });

    setNewExam({
      subject: '',
      title: '',
      class: '',
      duration: '',
      totalMarks: '',
      instructions: '',
      deadline: ''
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Exam</CardTitle>
        <CardDescription>Fill in the details to create a new examination</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Select value={newExam.subject} onValueChange={(value) => setNewExam({...newExam, subject: value})}>
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
              value={newExam.title}
              onChange={(e) => setNewExam({...newExam, title: e.target.value})}
              placeholder="e.g., Mid-Term Examination"
            />
          </div>
          <div>
            <Label htmlFor="class">Class *</Label>
            <Select value={newExam.class} onValueChange={(value) => setNewExam({...newExam, class: value})}>
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
              value={newExam.duration}
              onChange={(e) => setNewExam({...newExam, duration: e.target.value})}
              placeholder="90"
            />
          </div>
          <div>
            <Label htmlFor="totalMarks">Total Marks</Label>
            <Input
              id="totalMarks"
              type="number"
              value={newExam.totalMarks}
              onChange={(e) => setNewExam({...newExam, totalMarks: e.target.value})}
              placeholder="100"
            />
          </div>
          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={newExam.deadline}
              onChange={(e) => setNewExam({...newExam, deadline: e.target.value})}
            />
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            value={newExam.instructions}
            onChange={(e) => setNewExam({...newExam, instructions: e.target.value})}
            placeholder="Enter exam instructions..."
            rows={3}
          />
        </div>
        <div className="flex gap-2 mt-6">
          <Button onClick={handleCreateExam} className="bg-blue-600 hover:bg-blue-700">
            Create Exam
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
