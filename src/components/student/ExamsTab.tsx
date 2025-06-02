
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Calendar, Award, Play } from 'lucide-react';
import { Exam } from '@/types/examTypes';

interface ExamsTabProps {
  availableExams: Exam[];
  userClassId?: string;
  onStartExam: (examId: string, examTitle: string) => void;
}

const ExamsTab = ({ availableExams, userClassId, onStartExam }: ExamsTabProps) => {
  const getStatusBadge = (status: string, attempts: number = 0, maxAttempts: number = 1) => {
    if (status === 'expired') return <Badge variant="destructive">Expired</Badge>;
    if (attempts >= maxAttempts) return <Badge variant="secondary">Completed</Badge>;
    return <Badge variant="default">Available</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Exams for Class {userClassId}</CardTitle>
        <CardDescription>
          Exams assigned to your class. Click "Start Exam" to begin taking your exams.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availableExams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No exams available for your class at the moment.</p>
              <p className="text-sm">Check back later for new exams from your teachers.</p>
            </div>
          ) : (
            availableExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold">{exam.title}</h3>
                    {getStatusBadge(exam.status, exam.attempts, exam.maxAttempts)}
                    <Badge variant="outline">{exam.subject}</Badge>
                    <Badge variant="secondary">{exam.class}</Badge>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {exam.duration} minutes
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {exam.questions} questions
                    </div>
                    {exam.deadline && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {exam.deadline}
                      </div>
                    )}
                    {exam.totalMarks && (
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1" />
                        {exam.totalMarks} marks
                      </div>
                    )}
                  </div>
                  {exam.instructions && (
                    <p className="text-sm text-gray-500 mt-2 italic">{exam.instructions}</p>
                  )}
                </div>
                <div className="ml-4">
                  <Button 
                    onClick={() => onStartExam(exam.id, exam.title)}
                    disabled={exam.status === 'expired' || (exam.attempts || 0) >= (exam.maxAttempts || 1) || exam.questions === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {exam.questions === 0 ? 'No Questions' : 'Start Exam'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamsTab;
