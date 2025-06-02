
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Analytics = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Average Score</span>
              <span className="font-bold">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Highest Score</span>
              <span className="font-bold">98%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Lowest Score</span>
              <span className="font-bold">65%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Pass Rate</span>
              <span className="font-bold">92%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Mathematics</span>
              <span className="font-bold">87%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>English</span>
              <span className="font-bold">82%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Physics</span>
              <span className="font-bold">79%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Chemistry</span>
              <span className="font-bold">85%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
