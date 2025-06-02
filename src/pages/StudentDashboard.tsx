
import { Layout } from '../components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';
import StatsCards from '../components/student/StatsCards';
import ExamsTab from '../components/student/ExamsTab';
import ResultsTab from '../components/student/ResultsTab';
import ProfileTab from '../components/student/ProfileTab';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getExamsByClass } = useExam();
  
  // Get exams specific to the student's class
  const availableExams = user?.classId ? getExamsByClass(user.classId) : [];

  const completedExams = [
    { subject: 'Physics', score: 85, totalMarks: 100, date: '2024-05-20', grade: 'A' },
    { subject: 'Biology', score: 78, totalMarks: 100, date: '2024-05-18', grade: 'B+' },
    { subject: 'History', score: 92, totalMarks: 100, date: '2024-05-15', grade: 'A+' },
  ];

  const stats = {
    totalExams: availableExams.length + completedExams.length,
    completed: completedExams.length,
    average: 85,
    rank: 3
  };

  const startExam = (examId: string, examTitle: string) => {
    console.log(`Starting exam: ${examTitle} (ID: ${examId})`);
    navigate(`/exam/${examId}`, { 
      state: { examTitle }
    });
  };

  return (
    <Layout title="Student Dashboard">
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600">Class: {user?.classId}</p>
        </div>

        <StatsCards 
          totalExams={stats.totalExams}
          completed={stats.completed}
          average={stats.average}
          rank={stats.rank}
        />

        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="exams">Available Exams</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <ExamsTab 
              availableExams={availableExams}
              userClassId={user?.classId}
              onStartExam={startExam}
            />
          </TabsContent>
          
          <TabsContent value="results">
            <ResultsTab completedExams={completedExams} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab user={user} stats={stats} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
