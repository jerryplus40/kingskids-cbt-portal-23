
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  FileText, 
  Calendar,
  Play,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useExam } from '../contexts/ExamContext';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exams } = useExam();
  
  // Filter exams that are available to students
  const availableExams = exams.filter(exam => exam.status === 'available' || exam.status === 'active');

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
    // Navigate to the specific exam without redirecting to other exams
    navigate(`/exam/${examId}`, { 
      state: { examTitle } // Pass exam title to ensure we're accessing the right exam
    });
  };

  const getStatusBadge = (status: string, attempts: number = 0, maxAttempts: number = 1) => {
    if (status === 'expired') return <Badge variant="destructive">Expired</Badge>;
    if (attempts >= maxAttempts) return <Badge variant="secondary">Completed</Badge>;
    return <Badge variant="default">Available</Badge>;
  };

  return (
    <Layout title="Student Dashboard">
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-gray-600">Class: {user?.classId}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stats.totalExams}</p>
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
                  <p className="text-2xl font-bold">{stats.completed}</p>
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
                  <p className="text-2xl font-bold">{stats.average}%</p>
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
                  <p className="text-2xl font-bold">#{stats.rank}</p>
                  <p className="text-gray-600">Class Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="exams">Available Exams</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle>Available Exams</CardTitle>
                <CardDescription>
                  Click "Start Exam" to begin taking your exams. Each exam can be selected and accessed individually.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {availableExams.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No exams available at the moment.</p>
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
                            onClick={() => startExam(exam.id, exam.title)}
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
          </TabsContent>

          <TabsContent value="results">
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
          </TabsContent>

          <TabsContent value="profile">
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
