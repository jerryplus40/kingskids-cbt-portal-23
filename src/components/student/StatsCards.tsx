
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, CheckCircle, TrendingUp, Award } from 'lucide-react';

interface StatsCardsProps {
  totalExams: number;
  completed: number;
  average: number;
  rank: number;
}

const StatsCards = ({ totalExams, completed, average, rank }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{totalExams}</p>
              <p className="text-gray-600">Total Exams</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{completed}</p>
              <p className="text-gray-600">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{average}%</p>
              <p className="text-gray-600">Average Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">#{rank}</p>
              <p className="text-gray-600">Class Rank</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
