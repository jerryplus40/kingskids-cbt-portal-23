import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  School, 
  BookOpen, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  UserCheck,
  UserX,
  BarChart3,
  FileText,
  Database,
  Shield,
  Upload,
  GraduationCap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateEntrance, setShowCreateEntrance] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    class: '',
    subject: ''
  });
  const [newEntrance, setNewEntrance] = useState({
    title: '',
    duration: '',
    class: '',
    instructions: '',
    questions: ''
  });

  // Mock data
  const systemStats = {
    totalStudents: 450,
    totalTeachers: 25,
    totalParents: 380,
    totalExams: 125,
    activeExams: 8,
    completedExams: 117,
    entranceExams: 12
  };

  const entranceExams = [
    { 
      id: '1', 
      title: 'SS1 Entrance Examination 2024', 
      class: 'SS1', 
      duration: 120, 
      questions: 50,
      status: 'active',
      created: '2024-01-15',
      applicants: 45
    },
    { 
      id: '2', 
      title: 'SS2 Mid-Year Entrance', 
      class: 'SS2', 
      duration: 90, 
      questions: 40,
      status: 'draft',
      created: '2024-01-10',
      applicants: 0
    },
    { 
      id: '3', 
      title: 'SS3 Advanced Placement', 
      class: 'SS3', 
      duration: 150, 
      questions: 60,
      status: 'completed',
      created: '2024-01-05',
      applicants: 23
    }
  ];

  const users = [
    { id: '1', name: 'John Doe', email: 'john@student.com', role: 'student', class: 'SS1A', status: 'active' },
    { id: '2', name: 'Mrs. Smith', email: 'smith@teacher.com', role: 'teacher', subject: 'Mathematics', status: 'active' },
    { id: '3', name: 'Mr. Johnson', email: 'johnson@parent.com', role: 'parent', children: '2', status: 'active' },
    { id: '4', name: 'Jane Wilson', email: 'jane@student.com', role: 'student', class: 'SS2B', status: 'inactive' },
  ];

  const classes = [
    { id: '1', name: 'SS1A', students: 35, classTeacher: 'Mrs. Adams', subjects: 9 },
    { id: '2', name: 'SS1B', students: 32, classTeacher: 'Mr. Brown', subjects: 9 },
    { id: '3', name: 'SS2A', students: 38, classTeacher: 'Mrs. Davis', subjects: 10 },
    { id: '4', name: 'SS2B', students: 30, classTeacher: 'Mr. Wilson', subjects: 10 },
    { id: '5', name: 'SS3A', students: 28, classTeacher: 'Mrs. Taylor', subjects: 12 },
    { id: '6', name: 'SS3B', students: 25, classTeacher: 'Mr. Anderson', subjects: 12 },
  ];

  const subjects = [
    { id: '1', name: 'Mathematics', teacher: 'Mrs. Smith', classes: ['SS1A', 'SS1B'], students: 67 },
    { id: '2', name: 'English Language', teacher: 'Mr. Johnson', classes: ['SS1A', 'SS2A'], students: 73 },
    { id: '3', name: 'Physics', teacher: 'Dr. Brown', classes: ['SS2A', 'SS3A'], students: 66 },
    { id: '4', name: 'Chemistry', teacher: 'Mrs. Davis', classes: ['SS2B', 'SS3B'], students: 55 },
    { id: '5', name: 'Biology', teacher: 'Mr. Wilson', classes: ['SS1B', 'SS2B'], students: 62 },
  ];

  const systemLogs = [
    { timestamp: '2024-06-01 14:30', user: 'john@student.com', action: 'Login', status: 'Success' },
    { timestamp: '2024-06-01 14:25', user: 'smith@teacher.com', action: 'Created Exam', status: 'Success' },
    { timestamp: '2024-06-01 14:20', user: 'admin@system.com', action: 'User Management', status: 'Success' },
    { timestamp: '2024-06-01 14:15', user: 'jane@student.com', action: 'Login Attempt', status: 'Failed' },
  ];

  const handleCreateEntrance = () => {
    if (!newEntrance.title || !newEntrance.duration || !newEntrance.class) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Entrance Exam Created",
      description: `${newEntrance.title} has been created successfully`,
    });

    setNewEntrance({ title: '', duration: '', class: '', instructions: '', questions: '' });
    setShowCreateEntrance(false);
  };

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "User Created",
      description: `${newUser.name} has been added successfully`,
    });

    setNewUser({ name: '', email: '', role: '', class: '', subject: '' });
    setShowCreateUser(false);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      teacher: 'bg-green-100 text-green-800',
      parent: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[role as keyof typeof colors]}>{role.toUpperCase()}</Badge>;
  };

  const getEntranceStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return <Badge className={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Layout title="Admin Dashboard">
      <div className="px-4 sm:px-0">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <GraduationCap className="h-6 w-6 text-purple-600" />
                <div className="ml-3">
                  <p className="text-lg font-bold">{systemStats.entranceExams}</p>
                  <p className="text-xs text-gray-600">Entrance Exams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-lg font-bold">{systemStats.totalStudents}</p>
                  <p className="text-xs text-gray-600">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserCheck className="h-6 w-6 text-green-600" />
                <div className="ml-3">
                  <p className="text-lg font-bold">{systemStats.totalTeachers}</p>
                  <p className="text-xs text-gray-600">Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-purple-600" />
                <div className="ml-3">
                  <p className="text-lg font-bold">{systemStats.totalParents}</p>
                  <p className="text-xs text-gray-600">Parents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <School className="h-6 w-6 text-orange-600" />
                <div className="ml-3">
                  <p className="text-lg font-bold">{classes.length}</p>
                  <p className="text-xs text-gray-600">Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-indigo-600" />
                <div className="ml-3">
                  <p className="text-lg font-bold">{systemStats.activeExams}</p>
                  <p className="text-xs text-gray-600">Active Exams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 text-teal-600" />
                <div className="ml-3">
                  <p className="text-lg font-bold">{systemStats.totalExams}</p>
                  <p className="text-xs text-gray-600">Total Exams</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="entrance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="entrance">Entrance Examination</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="entrance">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Entrance Examination Management</h2>
                <Button onClick={() => setShowCreateEntrance(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Entrance Exam
                </Button>
              </div>

              {showCreateEntrance && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Entrance Examination</CardTitle>
                    <CardDescription>Set up a new entrance examination for prospective students</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="examTitle">Examination Title *</Label>
                        <Input
                          id="examTitle"
                          value={newEntrance.title}
                          onChange={(e) => setNewEntrance({...newEntrance, title: e.target.value})}
                          placeholder="e.g., SS1 Entrance Examination 2024"
                        />
                      </div>
                      <div>
                        <Label htmlFor="examClass">Target Class *</Label>
                        <Select value={newEntrance.class} onValueChange={(value) => setNewEntrance({...newEntrance, class: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SS1">SS1</SelectItem>
                            <SelectItem value="SS2">SS2</SelectItem>
                            <SelectItem value="SS3">SS3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="examDuration">Duration (minutes) *</Label>
                        <Input
                          id="examDuration"
                          type="number"
                          value={newEntrance.duration}
                          onChange={(e) => setNewEntrance({...newEntrance, duration: e.target.value})}
                          placeholder="e.g., 120"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="examInstructions">Instructions</Label>
                        <Textarea
                          id="examInstructions"
                          value={newEntrance.instructions}
                          onChange={(e) => setNewEntrance({...newEntrance, instructions: e.target.value})}
                          placeholder="Enter examination instructions for students..."
                          rows={3}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="examQuestions">Upload Questions</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to upload question file or drag and drop</p>
                          <p className="text-xs text-gray-400">Supported formats: PDF, DOC, DOCX</p>
                          <Input type="file" className="hidden" accept=".pdf,.doc,.docx" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={handleCreateEntrance} className="bg-purple-600 hover:bg-purple-700">
                        Create Entrance Exam
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateEntrance(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>All Entrance Examinations</CardTitle>
                  <CardDescription>Manage entrance examinations for all classes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {entranceExams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <GraduationCap className="h-8 w-8 text-purple-600" />
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{exam.title}</h3>
                              {getEntranceStatusBadge(exam.status)}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Target Class: <span className="font-medium">{exam.class}</span></p>
                              <p>Duration: <span className="font-medium">{exam.duration} minutes</span> • Questions: <span className="font-medium">{exam.questions}</span></p>
                              <p>Created: <span className="font-medium">{exam.created}</span> • Applicants: <span className="font-medium">{exam.applicants}</span></p>
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">User Management</h2>
                <Button onClick={() => setShowCreateUser(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>

              {showCreateUser && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New User</CardTitle>
                    <CardDescription>Add a new user to the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role *</Label>
                        <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newUser.role === 'student' && (
                        <div>
                          <Label htmlFor="class">Class</Label>
                          <Select value={newUser.class} onValueChange={(value) => setNewUser({...newUser, class: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {newUser.role === 'teacher' && (
                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Select value={newUser.subject} onValueChange={(value) => setNewUser({...newUser, subject: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
                        Create User
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage system users and their permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{user.name}</h3>
                              {getRoleBadge(user.role)}
                              {getStatusBadge(user.status)}
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            {user.class && <p className="text-xs text-gray-500">Class: {user.class}</p>}
                            {user.subject && <p className="text-xs text-gray-500">Subject: {user.subject}</p>}
                            {user.children && <p className="text-xs text-gray-500">Children: {user.children}</p>}
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classes">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Class Management</h2>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                  <Card key={cls.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        {cls.name}
                        <Badge variant="outline">{cls.students} students</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Class Teacher:</span> {cls.classTeacher}</p>
                        <p><span className="font-medium">Students:</span> {cls.students}</p>
                        <p><span className="font-medium">Subjects:</span> {cls.subjects}</p>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subjects">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Subject Management</h2>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Subjects</CardTitle>
                  <CardDescription>Manage subjects and assigned teachers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{subject.name}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            <p>Teacher: {subject.teacher}</p>
                            <p>Classes: {subject.classes.join(', ')}</p>
                            <p>Total Students: {subject.students}</p>
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input id="schoolName" defaultValue="King's Kids Christian International High School" />
                  </div>
                  <div>
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input id="academicYear" defaultValue="2023/2024" />
                  </div>
                  <div>
                    <Label htmlFor="examDuration">Default Exam Duration (minutes)</Label>
                    <Input id="examDuration" type="number" defaultValue="90" />
                  </div>
                  <Button className="w-full">Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="30" />
                  </div>
                  <div>
                    <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                    <Input id="maxAttempts" type="number" defaultValue="3" />
                  </div>
                  <div>
                    <Label htmlFor="passwordPolicy">Password Minimum Length</Label>
                    <Input id="passwordPolicy" type="number" defaultValue="8" />
                  </div>
                  <Button className="w-full">Update Security</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Student Performance Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Class Performance Summary
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Teacher Performance Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Subject Analysis Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    System Usage Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Audit Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Exam Statistics Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    User Activity Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>System Activity Logs</CardTitle>
                <CardDescription>Monitor system activities and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemLogs.map((log, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-gray-600">{log.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{log.timestamp}</p>
                        <Badge className={log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {log.status}
                        </Badge>
                      </div>
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

export default AdminDashboard;
