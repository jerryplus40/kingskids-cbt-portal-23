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
  BookOpen
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
    { id: 'mathematics', name: 'Mathematics', color: 'bg-blue-500' },
    { id: 'english', name: 'English', color: 'bg-green-500' },
    { id: 'science', name: 'Science', color: 'bg-purple-500' },
    { id: 'general-knowledge', name: 'General Knowledge', color: 'bg-orange-500' }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Entrance Examination Registration</h1>
            <p className="text-xl text-gray-600">King's Kids Christian International High School</p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <User className="h-6 w-6 mr-2 text-blue-600" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={studentInfo.firstName}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={studentInfo.lastName}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={studentInfo.email}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={studentInfo.phone}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class Applying For *</Label>
                  <Select value={studentInfo.class} onValueChange={(value) => setStudentInfo(prev => ({ ...prev, class: value }))}>
                    <SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={studentInfo.dateOfBirth}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previousSchool">Previous School</Label>
                  <Input
                    id="previousSchool"
                    value={studentInfo.previousSchool}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, previousSchool: e.target.value }))}
                    placeholder="Enter your previous school"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Guardian/Parent Name</Label>
                  <Input
                    id="guardianName"
                    value={studentInfo.guardianName}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, guardianName: e.target.value }))}
                    placeholder="Enter guardian's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianPhone">Guardian/Parent Phone</Label>
                  <Input
                    id="guardianPhone"
                    value={studentInfo.guardianPhone}
                    onChange={(e) => setStudentInfo(prev => ({ ...prev, guardianPhone: e.target.value }))}
                    placeholder="Enter guardian's phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={studentInfo.address}
                  onChange={(e) => setStudentInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your full address"
                />
              </div>
              
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => navigate('/')}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
                <Button onClick={handleRegistration} className="bg-blue-600 hover:bg-blue-700">
                  Continue to Instructions
                  <ChevronRight className="h-4 w-4 ml-2" />
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Examination Instructions</h1>
            <p className="text-xl text-gray-600">Please read carefully before starting</p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <AlertCircle className="h-6 w-6 mr-2 text-orange-600" />
                Important Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Exam Details</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-600" />
                      Duration: 60 minutes
                    </li>
                    <li className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-green-600" />
                      Total Questions: {getAllQuestions().length}
                    </li>
                    <li className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-purple-600" />
                      Subjects: Mathematics, English, Science, General Knowledge
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Rules & Guidelines</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• You must complete the exam within the time limit</li>
                    <li>• Each question has only one correct answer</li>
                    <li>• You can switch between subjects anytime</li>
                    <li>• You can review and change your answers</li>
                    <li>• Use the flag feature to mark questions for review</li>
                    <li>• The exam will auto-submit when time expires</li>
                    <li>• Ensure stable internet connection</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Technical Requirements</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <p>✓ Stable internet connection</p>
                    <p>✓ Updated web browser</p>
                  </div>
                  <div>
                    <p>✓ Quiet environment</p>
                    <p>✓ No external assistance</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Registration
                </Button>
                <Button onClick={handleStartExam} className="bg-green-600 hover:bg-green-700 text-lg px-8">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
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
      <div className="min-h-screen bg-gray-50">
        {/* Exam Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold">Entrance Examination</h1>
                <Badge variant="outline" className="text-sm">
                  {subjects.find(s => s.id === currentSubject)?.name}
                </Badge>
                <span className="text-lg font-bold">
                  Question {currentQuestionIndex[currentSubject] + 1}/{currentSubjectQuestions.length}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-red-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
                </div>
                <Button onClick={handleSubmitExam} className="bg-green-600 hover:bg-green-700">
                  Submit Exam
                </Button>
              </div>
            </div>
            <Progress value={getTotalProgress()} className="mt-3" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Subject Tabs */}
          <Tabs value={currentSubject} onValueChange={setCurrentSubject} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              {subjects.map((subject) => (
                <TabsTrigger key={subject.id} value={subject.id} className="relative">
                  <div className="flex items-center space-x-2">
                    <span>{subject.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(getSubjectProgress(subject.id))}%
                    </Badge>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {subjects.map((subject) => (
              <TabsContent key={subject.id} value={subject.id} className="mt-0">
                {/* Question Area */}
                <Card className="mb-6">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="text-lg leading-relaxed bg-gray-50 p-6 rounded-lg border">
                        {currentQ?.question}
                      </div>
                      
                      <RadioGroup
                        value={answers[getQuestionKey(currentSubject, currentQuestionIndex[currentSubject])] || ''}
                        onValueChange={handleAnswerChange}
                        className="space-y-4"
                      >
                        {currentQ?.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-200 transition-all">
                            <RadioGroupItem value={index.toString()} id={`option-${index}`} className="h-5 w-5" />
                            <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-lg">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-bold rounded-full mr-4">
                                {String.fromCharCode(65 + index)}
                              </span>
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => handleSubjectNavigation('prev')}
                      disabled={currentQuestionIndex[currentSubject] === 0}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleFlagQuestion}
                      variant={flaggedQuestions.has(getQuestionKey(currentSubject, currentQuestionIndex[currentSubject])) ? "default" : "outline"}
                      className={flaggedQuestions.has(getQuestionKey(currentSubject, currentQuestionIndex[currentSubject])) ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      {flaggedQuestions.has(getQuestionKey(currentSubject, currentQuestionIndex[currentSubject])) ? 'Unflag' : 'Flag'}
                    </Button>
                    
                    <Button
                      onClick={() => handleSubjectNavigation('next')}
                      disabled={currentQuestionIndex[currentSubject] === currentSubjectQuestions.length - 1}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  <div className="text-lg font-semibold text-gray-700">
                    Total Attempted: {Object.keys(answers).length}/{getAllQuestions().length}
                  </div>
                </div>

                {/* Question Navigator for Current Subject */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-8 gap-3">
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
                              h-12 w-12 text-lg font-bold
                              ${isAnswered ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                              ${isFlagged ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}
                              ${isCurrent ? 'ring-2 ring-blue-500' : ''}
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100 py-12">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="mb-8">
          <CheckCircle2 className="h-24 w-24 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Examination Completed!</h1>
          <p className="text-xl text-gray-600">Thank you for taking the entrance examination</p>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">What happens next?</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-semibold">Email Confirmation</h3>
                    <p className="text-sm text-gray-600">You'll receive a confirmation email shortly</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold">Results Review</h3>
                    <p className="text-sm text-gray-600">Our team will review your responses</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <Phone className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-semibold">Contact</h3>
                    <p className="text-sm text-gray-600">We'll contact you within 48 hours</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Important Note</h3>
                <p className="text-blue-800">
                  Your exam has been successfully submitted. Results will be communicated via email 
                  to <strong>{studentInfo.email}</strong> within 2-3 business days.
                </p>
              </div>

              <Button onClick={() => navigate('/')} className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3">
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
