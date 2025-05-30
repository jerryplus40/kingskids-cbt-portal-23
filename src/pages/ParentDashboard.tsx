
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  TrendingUp, 
  Calendar, 
  Award,
  BookOpen,
  Clock,
  MessageCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ParentDashboard = () => {
  const { user } = useAuth();

  // Mock data for child
  const childData = {
    name: 'John Doe',
    class: 'SS1A',
    studentId: '001',
    overallAverage: 85,
    position: 3,
    totalStudents: 45
  };

  const recentExams = [
    { subject: 'Mathematics', score: 92, grade: 'A+', date: '2024-06-01', maxScore: 100 },
    { subject: 'English Language', score: 78, grade: 'B+', date: '2024-05-28', maxScore: 100 },
    { subject: 'Physics', score: 85, grade: 'A', date: '2024-05-25', maxScore: 100 },
    { subject: 'Chemistry', score: 88, grade: 'A', date: '2024-05-22', maxScore: 100 },
    { subject: 'Biology', score: 82, grade: 'B+', date: '2024-05-20', maxScore: 100 },
  ];

  const upcomingExams = [
    { subject: 'Mathematics', date: '2024-06-15', time: '9:00 AM', duration: '90 mins' },
    { subject: 'English Language', date: '2024-06-16', time: '10:00 AM', duration: '120 mins' },
    { subject: 'History', date: '2024-06-18', time: '2:00 PM', duration: '90 mins' },
  ];

  const subjectPerformance = [
    { subject: 'Mathematics', average: 89, trend: 'up', lastScore: 92 },
    { subject: 'English Language', average: 82, trend: 'down', lastScore: 78 },
    { subject: 'Physics', average: 86, trend: 'up', lastScore: 85 },
    { subject: 'Chemistry', average: 85, trend: 'stable', lastScore: 88 },
    { subject: 'Biology', average: 80, trend: 'up', lastScore: 82 },
  ];

  const teacherComments = [
    {
      teacher: 'Mrs. Smith',
      subject: 'Mathematics',
      comment: 'John shows excellent problem-solving skills and consistently performs well in class.',
      date: '2024-06-01'
    },
    {
      teacher: 'Mr. Johnson',
      subject: 'English Language',
      comment: 'Good comprehension skills but needs to work on essay writing structure.',
      date: '2024-05-28'
    },
    {
      teacher: 'Dr. Brown',
      subject: 'Physics',
      comment: 'Very attentive in class and asks thoughtful questions. Keep up the good work!',
      date: '2024-05-25'
    },
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-50';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      case 'stable': return <TrendingUp className="h-4 w-4 text-gray-600 rotate-90" />;
      default: return null;
    }
  };

  return (
    <Layout title="Parent Dashboard">
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Monitor {childData.name}'s academic progress</p>
        </div>

        {/* Student Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{childData.overallAverage}%</p>
                  <p className="text-gray-600">Overall Average</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">#{childData.position}</p>
                  <p className="text-gray-600">Class Position</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{recentExams.length}</p>
                  <p className="text-gray-600">Exams Taken</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{upcomingExams.length}</p>
                  <p className="text-gray-600">Upcoming Exams</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="exams">Recent Exams</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
            <TabsTrigger value="comments">Teacher Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance Overview</CardTitle>
                  <CardDescription>Track your child's progress across all subjects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {subjectPerformance.map((subject, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{subject.subject}</span>
                            {getTrendIcon(subject.trend)}
                          </div>
                          <span className="text-sm font-bold">{subject.average}%</span>
                        </div>
                        <Progress value={subject.average} className="h-2" />
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Average: {subject.average}%</span>
                          <span>Last Score: {subject.lastScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Profile</CardTitle>
                  <CardDescription>Basic information about your child</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{childData.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{childData.studentId}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{childData.class}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class Size</label>
                        <div className="p-3 bg-gray-50 rounded-lg">{childData.totalStudents} students</div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Academic Standing</h3>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{childData.overallAverage}%</p>
                          <p className="text-sm text-gray-600">Overall Average</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">#{childData.position}</p>
                          <p className="text-sm text-gray-600">out of {childData.totalStudents}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle>Recent Exam Results</CardTitle>
                <CardDescription>View your child's latest examination performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentExams.map((exam, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{exam.subject}</h3>
                        <p className="text-sm text-gray-600">Examined on {exam.date}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-lg font-bold">{exam.score}/{exam.maxScore}</p>
                          <p className="text-sm text-gray-600">{Math.round((exam.score / exam.maxScore) * 100)}%</p>
                        </div>
                        <Badge className={getGradeColor(exam.grade)}>
                          {exam.grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Examinations</CardTitle>
                <CardDescription>Schedule of your child's future exams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingExams.map((exam, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{exam.subject}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {exam.date}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {exam.time}
                            </div>
                            <span>Duration: {exam.duration}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Scheduled</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Comments & Feedback</CardTitle>
                <CardDescription>Latest feedback from your child's teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teacherComments.map((comment, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">{comment.teacher}</span>
                          <Badge variant="outline">{comment.subject}</Badge>
                        </div>
                        <span className="text-sm text-gray-600">{comment.date}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ParentDashboard;
