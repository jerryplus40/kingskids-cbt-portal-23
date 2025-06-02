
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

export const StudentResults = () => {
  const studentResults = [
    { name: 'John Doe', class: 'SS1A', exam: 'Mathematics Mid-Term', score: 85, grade: 'A', date: '2024-06-01' },
    { name: 'Jane Smith', class: 'SS1A', exam: 'Mathematics Mid-Term', score: 78, grade: 'B+', date: '2024-06-01' },
    { name: 'Bob Johnson', class: 'SS1B', exam: 'Algebra Basics', score: 92, grade: 'A+', date: '2024-05-28' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Results</CardTitle>
        <CardDescription>View and manage student examination results</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {studentResults.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="font-semibold">{result.name}</p>
                    <p className="text-sm text-gray-600">{result.class}</p>
                  </div>
                  <div>
                    <p className="font-medium">{result.exam}</p>
                    <p className="text-sm text-gray-600">{result.date}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-lg font-bold">{result.score}%</p>
                  <Badge variant="outline">{result.grade}</Badge>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
