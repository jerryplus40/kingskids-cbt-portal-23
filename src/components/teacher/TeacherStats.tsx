
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, BookOpen, BarChart3 } from 'lucide-react';

interface TeacherStatsProps {
  examCount: number;
  questionCount: number;
}

export const TeacherStats = ({ examCount, questionCount }: TeacherStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{examCount}</p>
              <p className="text-gray-600">My Exams</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">47</p>
              <p className="text-gray-600">Students</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{questionCount}</p>
              <p className="text-gray-600">Questions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">85%</p>
              <p className="text-gray-600">Avg Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
