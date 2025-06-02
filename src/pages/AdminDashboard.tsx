import { useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Shield, GraduationCap, Upload, FileText, Calendar, Settings, PlusCircle, ClipboardList } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('entrance-exam');

  // Mock data for students
  const [students, setStudents] = useState([
    { id: '1', name: 'John Doe', class: 'SS1A', exams: 5, avgScore: 78 },
    { id: '2', name: 'Jane Smith', class: 'SS2B', exams: 3, avgScore: 92 },
    { id: '3', name: 'Michael Johnson', class: 'SS3A', exams: 7, avgScore: 85 },
    { id: '4', name: 'Emily Brown', class: 'SS1A', exams: 4, avgScore: 79 },
    { id: '5', name: 'David Wilson', class: 'SS2B', exams: 6, avgScore: 88 },
  ]);

  // Mock data for teachers
  const [teachers, setTeachers] = useState([
    { id: '1', name: 'Dr. Robert Williams', subject: 'Mathematics', examsCreated: 12, classes: ['SS1A', 'SS2B'] },
    { id: '2', name: 'Mrs. Sarah Johnson', subject: 'English', examsCreated: 8, classes: ['SS1A', 'SS3A'] },
    { id: '3', name: 'Mr. James Thompson', subject: 'Physics', examsCreated: 10, classes: ['SS2B', 'SS3A'] },
    { id: '4', name: 'Ms. Patricia Davis', subject: 'Chemistry', examsCreated: 7, classes: ['SS1A', 'SS2B'] },
  ]);

  // Mock data for parents
  const [parents, setParents] = useState([
    { id: '1', name: 'Mr. & Mrs. Doe', students: ['John Doe'], lastLogin: '2023-05-15' },
    { id: '2', name: 'Mr. & Mrs. Smith', students: ['Jane Smith'], lastLogin: '2023-05-10' },
    { id: '3', name: 'Mr. & Mrs. Johnson', students: ['Michael Johnson'], lastLogin: '2023-05-12' },
    { id: '4', name: 'Mr. & Mrs. Brown', students: ['Emily Brown'], lastLogin: '2023-05-08' },
  ]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
    }
  };

  const quickAccessItems = [
    {
      id: 'entrance-exam',
      title: 'Entrance Examination',
      description: 'Manage entrance exams for all classes',
      icon: ClipboardList,
      color: 'bg-orange-100 text-orange-600',
      hoverColor: 'hover:bg-orange-500 group-hover:text-white'
    },
    {
      id: 'students',
      title: 'Student Portal',
      description: 'Take exams and view results',
      icon: GraduationCap,
      color: 'bg-blue-100 text-blue-600',
      hoverColor: 'hover:bg-blue-500 group-hover:text-white'
    },
    {
      id: 'teachers',
      title: 'Teacher Portal',
      description: 'Create and manage exams',
      icon: BookOpen,
      color: 'bg-green-100 text-green-600',
      hoverColor: 'hover:bg-green-500 group-hover:text-white'
    },
    {
      id: 'parents',
      title: 'Parent Portal',
      description: "Monitor child's progress",
      icon: Users,
      color: 'bg-purple-100 text-purple-600',
      hoverColor: 'hover:bg-purple-500 group-hover:text-white'
    },
    {
      id: 'system',
      title: 'Admin Portal',
      description: 'System management',
      icon: Shield,
      color: 'bg-red-100 text-red-600',
      hoverColor: 'hover:bg-red-500 group-hover:text-white'
    }
  ];

  return (
    <Layout title="Admin Dashboard">
      <div className="px-4 sm:px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="entrance-exam" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Entrance Exam
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="teachers" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Teachers
            </TabsTrigger>
            <TabsTrigger value="parents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parents
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Quick Demo Access Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900">Quick Demo Access</CardTitle>
              <CardDescription>Explore different portal views instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickAccessItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      variant="outline"
                      className={`h-20 justify-start border-2 transition-all duration-300 group ${
                        activeTab === item.id ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-4 transition-colors duration-300 ${item.color} ${item.hoverColor}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Entrance Examination Tab */}
          <TabsContent value="entrance-exam" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-orange-600" />
                    Entrance Examination Management
                  </CardTitle>
                  <CardDescription>
                    Create and manage entrance examinations for all classes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Create New Entrance Exam */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Create New Entrance Exam</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="exam-title">Exam Title</Label>
                          <Input id="exam-title" placeholder="e.g., JSS1 Entrance Examination 2024" />
                        </div>
                        <div>
                          <Label htmlFor="class-level">Class Level</Label>
                          <select id="class-level" className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="">Select Class</option>
                            <option value="jss1">JSS 1</option>
                            <option value="jss2">JSS 2</option>
                            <option value="jss3">JSS 3</option>
                            <option value="ss1">SS 1</option>
                            <option value="ss2">SS 2</option>
                            <option value="ss3">SS 3</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="exam-duration">Duration (minutes)</Label>
                          <Input id="exam-duration" type="number" placeholder="90" />
                        </div>
                        <div>
                          <Label htmlFor="exam-file">Upload Question File</Label>
                          <Input 
                            id="exam-file" 
                            type="file" 
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileUpload}
                          />
                        </div>
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Entrance Exam
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Exam Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4">
                          <div className="text-2xl font-bold text-orange-600">12</div>
                          <div className="text-sm text-gray-600">Active Entrance Exams</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold text-blue-600">348</div>
                          <div className="text-sm text-gray-600">Total Applicants</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold text-green-600">298</div>
                          <div className="text-sm text-gray-600">Completed Exams</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold text-purple-600">85%</div>
                          <div className="text-sm text-gray-600">Pass Rate</div>
                        </Card>
                      </div>
                    </div>
                  </div>

                  {/* Existing Entrance Exams */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Existing Entrance Examinations</h3>
                    <div className="space-y-3">
                      {[
                        { title: 'JSS1 Entrance Examination 2024', class: 'JSS 1', applicants: 45, status: 'Active' },
                        { title: 'JSS2 Mid-Session Entry Exam', class: 'JSS 2', applicants: 23, status: 'Active' },
                        { title: 'SS1 Entrance Examination 2024', class: 'SS 1', applicants: 67, status: 'Completed' },
                      ].map((exam, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">{exam.title}</h4>
                              <p className="text-sm text-gray-600">Class: {exam.class} • {exam.applicants} applicants</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={exam.status === 'Active' ? 'default' : 'secondary'}>
                                {exam.status}
                              </Badge>
                              <Button variant="outline" size="sm">View Details</Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    Student Management
                  </CardTitle>
                  <CardDescription>
                    View and manage all students in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Input placeholder="Search students..." className="w-64" />
                        <Button variant="outline">Search</Button>
                      </div>
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exams Taken</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Score</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {students.map((student) => (
                            <tr key={student.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{student.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="outline">{student.class}</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {student.exams}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                    student.avgScore >= 90 ? 'bg-green-500' : 
                                    student.avgScore >= 70 ? 'bg-blue-500' : 
                                    student.avgScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}></div>
                                  {student.avgScore}%
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Button variant="ghost" size="sm">View</Button>
                                <Button variant="ghost" size="sm">Edit</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Teacher Management
                  </CardTitle>
                  <CardDescription>
                    View and manage all teachers in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Input placeholder="Search teachers..." className="w-64" />
                        <Button variant="outline">Search</Button>
                      </div>
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Teacher
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exams Created</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {teachers.map((teacher) => (
                            <tr key={teacher.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{teacher.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {teacher.subject}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {teacher.examsCreated}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex gap-1">
                                  {teacher.classes.map((cls, idx) => (
                                    <Badge key={idx} variant="outline">{cls}</Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Button variant="ghost" size="sm">View</Button>
                                <Button variant="ghost" size="sm">Edit</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Parents Tab */}
          <TabsContent value="parents" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Parent Management
                  </CardTitle>
                  <CardDescription>
                    View and manage all parents in the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Input placeholder="Search parents..." className="w-64" />
                        <Button variant="outline">Search</Button>
                      </div>
                      <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Parent
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {parents.map((parent) => (
                            <tr key={parent.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{parent.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  {parent.students.map((student, idx) => (
                                    <div key={idx}>{student}</div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {parent.lastLogin}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Button variant="ghost" size="sm">View</Button>
                                <Button variant="ghost" size="sm">Edit</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    System Settings
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">General Settings</h3>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="school-name">School Name</Label>
                            <Input id="school-name" defaultValue="King's Kids Christian International High School" />
                          </div>
                          <div>
                            <Label htmlFor="academic-year">Current Academic Year</Label>
                            <Input id="academic-year" defaultValue="2023/2024" />
                          </div>
                          <div>
                            <Label htmlFor="term">Current Term</Label>
                            <select id="term" className="w-full p-2 border border-gray-300 rounded-md">
                              <option value="1">First Term</option>
                              <option value="2">Second Term</option>
                              <option value="3">Third Term</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Backup & Maintenance</h3>
                        <div className="space-y-3">
                          <Button className="w-full">
                            <Upload className="h-4 w-4 mr-2" />
                            Backup Database
                          </Button>
                          <Button variant="outline" className="w-full">
                            <FileText className="h-4 w-4 mr-2" />
                            Export System Logs
                          </Button>
                          <Button variant="outline" className="w-full">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Maintenance
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">System Statistics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="p-4">
                          <div className="text-2xl font-bold text-blue-600">254</div>
                          <div className="text-sm text-gray-600">Total Students</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold text-green-600">18</div>
                          <div className="text-sm text-gray-600">Total Teachers</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold text-purple-600">187</div>
                          <div className="text-sm text-gray-600">Total Parents</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold text-orange-600">42</div>
                          <div className="text-sm text-gray-600">Active Exams</div>
                        </Card>
                      </div>
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

export default AdminDashboard;
