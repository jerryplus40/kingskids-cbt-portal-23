
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ExamResult {
  subject: string;
  score: number;
  totalMarks: number;
  date: string;
  grade: string;
}

interface ResultsTabProps {
  completedExams: ExamResult[];
}

const ResultsTab = ({ completedExams }: ResultsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Results</CardTitle>
        <CardDescription>
          View your completed exam scores and grades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {completedExams.map((exam, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">{exam.subject}</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Score: {exam.score}/{exam.totalMarks}</span>
                      <span>{Math.round((exam.score / exam.totalMarks) * 100)}%</span>
                    </div>
                    <Progress value={(exam.score / exam.totalMarks) * 100} className="h-2" />
                  </div>
                  <Badge variant="outline">{exam.grade}</Badge>
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="text-sm text-gray-600">{exam.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsTab;
