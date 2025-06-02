
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Users, Calendar } from 'lucide-react';
import { Exam } from '../../contexts/ExamContext';

interface ExamListProps {
  exams: Exam[];
  onDeleteExam: (id: string) => void;
}

export const ExamList = ({ exams, onDeleteExam }: ExamListProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'available': return <Badge className="bg-blue-100 text-blue-800">Available</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'draft': return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <Card key={exam.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{exam.title}</h3>
                  {getStatusBadge(exam.status)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>Subject: <span className="font-medium">{exam.subject}</span></div>
                  <div>Class: <span className="font-medium">{exam.class || 'All Classes'}</span></div>
                  <div>Duration: <span className="font-medium">{exam.duration} min</span></div>
                  <div>Questions: <span className="font-medium">{exam.questions}</span></div>
                </div>
                <div className="flex items-center space-x-6 mt-2 text-sm">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {exam.submitted || 0}/{exam.students || 0} submitted
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Due: {exam.deadline}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDeleteExam(exam.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
