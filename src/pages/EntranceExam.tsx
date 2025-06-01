import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  CheckCircle2,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Sparkles,
  Trophy,
  Star
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const EntranceExam = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [currentSubject, setCurrentSubject] = useState('mathematics');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<Record<string, number>>({
    mathematics: 0,
    english: 0,
    science: 0,
    'general-knowledge': 0
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [studentInfo, setStudentInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    previousSchool: '',
    guardianName: '',
    guardianPhone: '',
    class: ''
  });

  const steps = ['Registration', 'Instructions', 'Examination', 'Completion'];

  // Organized exam questions by subject
  const examQuestions = {
    mathematics: [
      {
        id: 'math-1',
        question: "If 3x + 7 = 22, what is the value of x?",
        options: ["x = 5", "x = 4", "x = 6", "x = 3"],
        correct: 0
      },
      {
        id: 'math-2',
        question: "What is 15% of 200?",
        options: ["25", "30", "35", "40"],
        correct: 1
      },
      {
        id: 'math-3',
        question: "What is the area of a rectangle with length 8cm and width 5cm?",
        options: ["40 cm²", "26 cm²", "13 cm²", "35 cm²"],
        correct: 0
      }
    ],
    english: [
      {
        id: 'eng-1',
        question: "Choose the correct spelling:",
        options: ["Recieve", "Receive", "Receve", "Receieve"],
        correct: 1
      },
      {
        id: 'eng-2',
        question: "What is the plural of 'child'?",
        options: ["childs", "children", "childes", "child's"],
        correct: 1
      }
    ],
    science: [
      {
        id: 'sci-1',
        question: "What is the chemical symbol for water?",
        options: ["H2O", "CO2", "NaCl", "O2"],
        correct: 0
      },
      {
        id: 'sci-2',
        question: "Which planet is closest to the Sun?",
        options: ["Venus", "Earth", "Mercury", "Mars"],
        correct: 2
      }
    ],
    'general-knowledge': [
      {
        id: 'gk-1',
        question: "What is the capital of Nigeria?",
        options: ["Lagos", "Abuja", "Kano", "Port Harcourt"],
        correct: 1
      }
    ]
  };

  const subjects = [
    { id: 'mathematics', name: 'Mathematics', color: 'from-blue-500 to-blue-600', icon: '📊', textColor: 'text-blue-700' },
    { id: 'english', name: 'English', color: 'from-emerald-500 to-emerald-600', icon: '📚', textColor: 'text-emerald-700' },
    { id: 'science', name: 'Science', color: 'from-purple-500 to-purple-600', icon: '🧪', textColor: 'text-purple-700' },
    { id: 'general-knowledge', name: 'General Knowledge', color: 'from-orange-500 to-orange-600', icon: '🌍', textColor: 'text-orange-700' }
  ];

  const getAllQuestions = () => {
    return Object.values(examQuestions).flat();
  };

  const getCurrentQuestion = () => {
    const subjectQuestions = examQuestions[currentSubject as keyof typeof examQuestions];
    const questionIndex = currentQuestionIndex[currentSubject];
    return subjectQuestions[questionIndex];
  };

  const getQuestionKey = (subject: string, index: number) => {
    return `${subject}-${index}`;
  };

  useEffect(() => {
    if (currentStep === 2) { // During examination
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentStep]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRegistration = () => {
    if (!studentInfo.firstName || !studentInfo.lastName || !studentInfo.email || !studentInfo.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(1);
  };

  const handleStartExam = () => {
    setCurrentStep(2);
    toast({
      title: "Exam Started",
      description: "Good luck! You have 60 minutes to complete the exam.",
    });
  };

  const handleAnswerChange = (value: string) => {
    const questionKey = getQuestionKey(currentSubject, currentQuestionIndex[currentSubject]);
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
  };

  const handleFlagQuestion = () => {
    const questionKey = getQuestionKey(currentSubject, currentQuestionIndex[currentSubject]);
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionKey)) {
        newSet.delete(questionKey);
      } else {
        newSet.add(questionKey);
      }
      return newSet;
    });
  };

  const handleSubjectNavigation = (direction: 'prev' | 'next') => {
    const subjectQuestions = examQuestions[currentSubject as keyof typeof examQuestions];
    const currentIndex = currentQuestionIndex[currentSubject];
    
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentQuestionIndex(prev => ({
        ...prev,
        [currentSubject]: currentIndex - 1
      }));
    } else if (direction === 'next' && currentIndex < subjectQuestions.length - 1) {
      setCurrentQuestionIndex(prev => ({
        ...prev,
        [currentSubject]: currentIndex + 1
      }));
    }
  };

  const handleSubmitExam = () => {
    const allQuestions = getAllQuestions();
    const score = allQuestions.reduce((total, question, index) => {
      const questionKey = getQuestionKey(question.id.split('-')[0], parseInt(question.id.split('-')[1]) - 1);
      const userAnswer = parseInt(answers[questionKey]);
      return total + (userAnswer === question.correct ? 1 : 0);
    }, 0);

    const percentage = Math.round((score / allQuestions.length) * 100);
    
    setCurrentStep(3);
    
    toast({
      title: "Exam Completed",
      description: `You scored ${score}/${allQuestions.length} (${percentage}%)`,
    });
  };

  const getTotalProgress = () => {
    const totalQuestions = getAllQuestions().length;
    const answeredQuestions = Object.keys(answers).length;
    return (answeredQuestions / totalQuestions) * 100;
  };

  const getSubjectProgress = (subjectId: string) => {
    const subjectQuestions = examQuestions[subjectId as keyof typeof examQuestions];
    const answeredInSubject = subjectQuestions.filter((_, index) => {
      const questionKey = getQuestionKey(subjectId, index);
      return answers[questionKey] !== undefined;
    }).length;
    return (answeredInSubject / subjectQuestions.length) * 100;
  };

  const currentQ = getCurrentQuestion();
  const currentSubjectQuestions = examQuestions[currentSubject as keyof typeof examQuestions];

  // Registration Step
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white shadow-lg">
                <GraduationCap className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Entrance Examination Registration
            </h1>
            <p className="text-2xl text-gray-600 font-medium">King's Kids Christian International High School</p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-gray-500">Your journey to excellence begins here</span>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-8">
              <CardTitle className="flex items-center text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <User className="h-8 w-8 mr-3 text-blue-600" />
                Student Information
              </CardTitle>
              <p className="text-gray-600 mt-2">Please provide your details to proceed with the entrance examination</p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base font-semibold text-gray-700">First Name *</Label>
                  <Input
                    id="firstName"
                    value={studentInfo.firstName}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-semibold text-gray-700">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={studentInfo.lastName}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-semibold text-gray-700 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={studentInfo.email}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-base font-semibold text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    value={studentInfo.phone}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="class" className="text-base font-semibold text-gray-700 flex items-center">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Class Applying For *
                  </Label>
                  <Select value={studentInfo.class} onValueChange={(value) => setStudentInfo(prev => ({ ...prev, class: value }))}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jss1">JSS 1</SelectItem>
                      <SelectItem value="jss2">JSS 2</SelectItem>
                      <SelectItem value="jss3">JSS 3</SelectItem>
                      <SelectItem value="ss1">SS 1</SelectItem>
                      <SelectItem value="ss2">SS 2</SelectItem>
                      <SelectItem value="ss3">SS 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="dateOfBirth" className="text-base font-semibold text-gray-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date of Birth
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={studentInfo.dateOfBirth}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="previousSchool" className="text-base font-semibold text-gray-700">Previous School</Label>
                  <Input
                    id="previousSchool"
                    value={studentInfo.previousSchool}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, previousSchool: e.target.value }))}
                    placeholder="Enter your previous school"
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="guardianName" className="text-base font-semibold text-gray-700">Guardian/Parent Name</Label>
                  <Input
                    id="guardianName"
                    value={studentInfo.guardianName}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, guardianName: e.target.value }))}
                    placeholder="Enter guardian's name"
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="guardianPhone" className="text-base font-semibold text-gray-700">Guardian/Parent Phone</Label>
                  <Input
                    id="guardianPhone"
                    value={studentInfo.guardianPhone}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, guardianPhone: e.target.value }))}
                    placeholder="Enter guardian's phone"
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="address" className="text-base font-semibold text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={studentInfo.address}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your full address"
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              
              <div className="flex justify-between pt-8">
                <Button variant="outline" onClick={() => navigate('/')} className="h-12 px-8 text-base border-2">
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Back to Home
                </Button>
                <Button onClick={handleRegistration} className="h-12 px-8 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg">
                  Continue to Instructions
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Instructions Step
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/30 to-blue-200/30 rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -translate-x-1/2 translate-y-1/2 animate-pulse" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full text-white shadow-lg">
                <AlertCircle className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Examination Instructions
            </h1>
            <p className="text-2xl text-gray-600 font-medium">Please read carefully before starting</p>
          </div>

          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-8">
              <CardTitle className="flex items-center text-3xl bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                <AlertCircle className="h-8 w-8 mr-3 text-orange-600" />
                Important Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-6 w-6 mr-2 text-blue-600" />
                    Exam Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Clock className="h-6 w-6 mr-3 text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-900">Duration</p>
                        <p className="text-blue-700">60 minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <FileText className="h-6 w-6 mr-3 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Total Questions</p>
                        <p className="text-green-700">{getAllQuestions().length} questions</p>
                      </div>
                    </div>
                    <div className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <BookOpen className="h-6 w-6 mr-3 text-purple-600" />
                      <div>
                        <p className="font-semibold text-purple-900">Subjects</p>
                        <p className="text-purple-700">Mathematics, English, Science, General Knowledge</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <CheckCircle2 className="h-6 w-6 mr-2 text-green-600" />
                    Rules & Guidelines
                  </h3>
                  <div className="space-y-3">
                    {[
                      "You must complete the exam within the time limit",
                      "Each question has only one correct answer",
                      "You can switch between subjects anytime",
                      "You can review and change your answers",
                      "Use the flag feature to mark questions for review",
                      "The exam will auto-submit when time expires",
                      "Ensure stable internet connection"
                    ].map((rule, index) => (
                      <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                        <Star className="h-5 w-5 mr-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-base">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border border-blue-200">
                <h3 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                  <Trophy className="h-6 w-6 mr-2" />
                  Technical Requirements
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {["Stable internet connection", "Updated web browser"].map((req, index) => (
                      <div key={index} className="flex items-center text-blue-800">
                        <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" />
                        <span className="text-base font-medium">{req}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {["Quiet environment", "No external assistance"].map((req, index) => (
                      <div key={index} className="flex items-center text-blue-800">
                        <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" />
                        <span className="text-base font-medium">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <Button variant="outline" onClick={() => setCurrentStep(0)} className="h-12 px-8 text-base border-2">
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Back to Registration
                </Button>
                <Button onClick={handleStartExam} className="h-12 px-10 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 mr-3" />
                  Start Examination
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Examination Step
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Exam Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white mr-4">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Entrance Examination
                  </h1>
                </div>
                <Badge variant="outline" className="text-base px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300">
                  {subjects.find(s => s.id === currentSubject)?.icon} {subjects.find(s => s.id === currentSubject)?.name}
                </Badge>
                <div className="text-xl font-bold text-gray-700">
                  Question {currentQuestionIndex[currentSubject] + 1}/{currentSubjectQuestions.length}
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                  <Clock className="h-6 w-6 mr-3 text-red-600" />
                  <span className="font-mono text-xl font-bold text-red-600">{formatTime(timeLeft)}</span>
                </div>
                <Button onClick={handleSubmitExam} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base px-6 py-2">
                  Submit Exam
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={getTotalProgress()} className="h-3 bg-gray-200" />
              <p className="text-sm text-gray-600 mt-2">Overall Progress: {Math.round(getTotalProgress())}%</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Subject Tabs */}
          <Tabs value={currentSubject} onValueChange={setCurrentSubject} className="mb-8">
            <TabsList className="grid w-full grid-cols-4 h-auto p-2 bg-white/50 backdrop-blur-sm">
              {subjects.map((subject) => (
                <TabsTrigger 
                  key={subject.id} 
                  value={subject.id} 
                  className="relative p-4 data-[state=active]:bg-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-2xl">{subject.icon}</div>
                    <span className="font-semibold">{subject.name}</span>
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      {Math.round(getSubjectProgress(subject.id))}%
                    </Badge>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {subjects.map((subject) => (
              <TabsContent key={subject.id} value={subject.id} className="mt-8">
                {/* Question Area */}
                <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-10">
                    <div className="space-y-8">
                      <div className="text-xl leading-relaxed bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border border-blue-200 font-medium">
                        {currentQ?.question}
                      </div>
                      
                      <RadioGroup
                        value={answers[getQuestionKey(currentSubject, currentQuestionIndex[currentSubject])] || ''}
                        onValueChange={handleAnswerChange}
                        className="space-y-5"
                      >
                        {currentQ?.options.map((option, index) => (
                          <div key={index} className="group">
                            <div className="flex items-center space-x-5 p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer">
                              <RadioGroupItem value={index.toString()} id={`option-${index}`} className="h-6 w-6" />
                              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-lg">
                                <span className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r ${subject.color} text-white font-bold rounded-full mr-6 shadow-lg`}>
                                  {String.fromCharCode(65 + index)}
                                </span>
                                {option}
                              </Label>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => handleSubjectNavigation('prev')}
                      disabled={currentQuestionIndex[currentSubject] === 0}
                      className="h-12 px-6 text-base bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleFlagQuestion}
                      variant={flaggedQuestions.has(getQuestionKey(currentSubject, currentQuestionIndex[currentSubject])) ? "default" : "outline"}
                      className={`h-12 px-6 text-base transition-all duration-200 ${
                        flaggedQuestions.has(getQuestionKey(currentSubject, currentQuestionIndex[currentSubject])) 
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0" 
                          : "border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                      }`}
                    >
                      <Flag className="h-5 w-5 mr-2" />
                      {flaggedQuestions.has(getQuestionKey(currentSubject, currentQuestionIndex[currentSubject])) ? 'Unflag' : 'Flag'}
                    </Button>
                    
                    <Button
                      onClick={() => handleSubjectNavigation('next')}
                      disabled={currentQuestionIndex[currentSubject] === currentSubjectQuestions.length - 1}
                      className="h-12 px-6 text-base bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>

                  <div className="text-lg font-bold text-gray-700 bg-white px-6 py-3 rounded-lg shadow-md">
                    Attempted: {Object.keys(answers).length}/{getAllQuestions().length}
                  </div>
                </div>

                {/* Question Navigator for Current Subject */}
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <h3 className="text-lg font-bold text-gray-700 mb-6 flex items-center">
                      <span className="text-2xl mr-2">{subject.icon}</span>
                      {subject.name} Questions
                    </h3>
                    <div className="grid grid-cols-8 gap-4">
                      {currentSubjectQuestions.map((_, index) => {
                        const questionKey = getQuestionKey(currentSubject, index);
                        const isAnswered = answers[questionKey] !== undefined;
                        const isFlagged = flaggedQuestions.has(questionKey);
                        const isCurrent = index === currentQuestionIndex[currentSubject];
                        
                        return (
                          <Button
                            key={index}
                            variant={isCurrent ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentQuestionIndex(prev => ({ ...prev, [currentSubject]: index }))}
                            className={`
                              h-14 w-14 text-lg font-bold transition-all duration-200 border-2
                              ${isAnswered ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400 hover:from-green-600 hover:to-emerald-600' : ''}
                              ${isFlagged ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-400 hover:from-yellow-600 hover:to-orange-600' : ''}
                              ${isCurrent ? 'ring-4 ring-blue-300 scale-110' : ''}
                              ${!isAnswered && !isFlagged ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50' : ''}
                            `}
                          >
                            {index + 1}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    );
  }

  // Completion Step
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-green-200/30 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 text-center">
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-8">
            <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white shadow-2xl animate-bounce">
              <CheckCircle2 className="h-16 w-16" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent mb-6">
            Examination Completed!
          </h1>
          <p className="text-2xl text-gray-600 font-medium">Thank you for taking the entrance examination</p>
          <div className="flex items-center justify-center mt-6 space-x-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <span className="text-lg text-gray-500">Well done! Your responses have been submitted successfully.</span>
            <Trophy className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-10">
            <div className="space-y-10">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  What happens next?
                </h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center group">
                    <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Mail className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">Email Confirmation</h3>
                    <p className="text-gray-600">You'll receive a confirmation email shortly</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-r from-green-100 to-green-200 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <FileText className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">Results Review</h3>
                    <p className="text-gray-600">Our team will review your responses</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-r from-purple-100 to-purple-200 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Phone className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-2">Contact</h3>
                    <p className="text-gray-600">We'll contact you within 48 hours</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl border border-blue-200">
                <h3 className="text-2xl font-bold text-blue-900 mb-4 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 mr-2" />
                  Important Note
                </h3>
                <p className="text-blue-800 text-lg leading-relaxed">
                  Your exam has been successfully submitted. Results will be communicated via email 
                  to <strong className="text-blue-900">{studentInfo.email}</strong> within 2-3 business days.
                </p>
              </div>

              <Button onClick={() => navigate('/')} className="w-full h-16 text-xl bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg">
                <CheckCircle2 className="h-6 w-6 mr-3" />
                Return to Home Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EntranceExam;
