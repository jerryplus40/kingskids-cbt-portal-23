
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TeacherDashboard = () => {
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [newExam, setNewExam] = useState({
    subject: '',
    title: '',
    duration: '',
    totalMarks: '',
    instructions: '',
    deadline: ''
  });

  // Mock data
  const myExams = [
    { 
      id: '1', 
      title: 'Mathematics Mid-Term', 
      subject: 'Mathematics',
      class: 'SS1A',
      questions: 50, 
      duration: 90, 
      students: 25,
      submitted: 18,
      deadline: '2024-06-15',
      status: 'active'
    },
    { 
      id: '2', 
      title: 'Algebra Basics', 
      subject: 'Mathematics',
      class: 'SS1B',
      questions: 30, 
      duration: 60, 
      students: 22,
      submitted: 22,
      deadline: '2024-06-10',
      status: 'completed'
    },
  ];

  const questionBank = [
    { id: '1', question: 'What is 2 + 2?', subject: 'Mathematics', difficulty: 'Easy', type: 'Multiple Choice' },
    { id: '2', question: 'Solve for x: 2x + 5 = 13', subject: 'Mathematics', difficulty: 'Medium', type: 'Multiple Choice' },
    { id: '3', question: 'Find the derivative of x²', subject: 'Mathematics', difficulty: 'Hard', type: 'Multiple Choice' },
  ];

  const studentResults = [
    { name: 'John Doe', class: 'SS1A', exam: 'Mathematics Mid-Term', score: 85, grade: 'A', date: '2024-06-01' },
    { name: 'Jane Smith', class: 'SS1A', exam: 'Mathematics Mid-Term', score: 78, grade: 'B+', date: '2024-06-01' },
    { name: 'Bob Johnson', class: 'SS1B', exam: 'Algebra Basics', score: 92, grade: 'A+', date: '2024-05-28' },
  ];

  const handleCreateExam = () => {
    if (!newExam.subject || !newExam.title || !newExam.duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Exam Created",
      description: `${newExam.title} has been created successfully`,
    });

    setNewExam({
      subject: '',
      title: '',
      duration: '',
      totalMarks: '',
      instructions: '',
      deadline: ''
    });
    setShowCreateExam(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'draft': return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Layout title="Teacher Dashboard">
      <div className="px-4 sm:px-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{myExams.length}</p>
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
                  <p className="text-2xl font-bold">{questionBank.length}</p>
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

        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="exams">My Exams</TabsTrigger>
            <TabsTrigger value="questions">Question Bank</TabsTrigger>
            <TabsTrigger value="results">Student Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Exam Management</h2>
                <Button onClick={() => setShowCreateExam(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </div>

              {showCreateExam && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Exam</CardTitle>
                    <CardDescription>Fill in the details to create a new examination</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Select value={newExam.subject} onValueChange={(value) => setNewExam({...newExam, subject: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="English">English Language</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                            <SelectItem value="Biology">Biology</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="title">Exam Title *</Label>
                        <Input
                          id="title"
                          value={newExam.title}
                          onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                          placeholder="e.g., Mid-Term Examination"
                        />
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration (minutes) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={newExam.duration}
                          onChange={(e) => setNewExam({...newExam, duration: e.target.value})}
                          placeholder="90"
                        />
                      </div>
                      <div>
                        <Label htmlFor="totalMarks">Total Marks</Label>
                        <Input
                          id="totalMarks"
                          type="number"
                          value={newExam.totalMarks}
                          onChange={(e) => setNewExam({...newExam, totalMarks: e.target.value})}
                          placeholder="100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={newExam.deadline}
                          onChange={(e) => setNewExam({...newExam, deadline: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={newExam.instructions}
                        onChange={(e) => setNewExam({...newExam, instructions: e.target.value})}
                        placeholder="Enter exam instructions..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={handleCreateExam} className="bg-blue-600 hover:bg-blue-700">
                        Create Exam
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateExam(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {myExams.map((exam) => (
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
                            <div>Class: <span className="font-medium">{exam.class}</span></div>
                            <div>Duration: <span className="font-medium">{exam.duration} min</span></div>
                            <div>Questions: <span className="font-medium">{exam.questions}</span></div>
                          </div>
                          <div className="flex items-center space-x-6 mt-2 text-sm">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {exam.submitted}/{exam.students} submitted
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
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Question Bank</h2>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {questionBank.map((question) => (
                  <Card key={question.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium mb-2">{question.question}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <Badge variant="outline">{question.subject}</Badge>
                            <span className={`font-medium ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                            <span className="text-gray-600">{question.type}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results">
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
          </TabsContent>

          <TabsContent value="analytics">
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
