
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/contexts/AuthContext';

interface Stats {
  totalExams: number;
  completed: number;
  average: number;
  rank: number;
}

interface ProfileTabProps {
  user: User | null;
  stats: Stats;
}

const ProfileTab = ({ user, stats }: ProfileTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Profile</CardTitle>
        <CardDescription>
          Your academic information and settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <div className="p-3 bg-gray-50 rounded-lg">{user?.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="p-3 bg-gray-50 rounded-lg">{user?.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Class</label>
              <div className="p-3 bg-gray-50 rounded-lg">{user?.classId}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Student ID</label>
              <div className="p-3 bg-gray-50 rounded-lg">{user?.id}</div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Academic Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.average}%</p>
                <p className="text-sm text-gray-600">Overall Average</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">#{stats.rank}</p>
                <p className="text-sm text-gray-600">Class Position</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.completed}/{stats.totalExams}</p>
                <p className="text-sm text-gray-600">Exams Completed</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
