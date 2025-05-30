
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [studentInfo, setStudentInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    previousSchool: '',
    guardianName: '',
    guardianPhone: ''
  });

  const steps = ['Registration', 'Instructions', 'Examination', 'Completion'];

  // Mock entrance exam questions
  const examQuestions = [
    {
      id: 1,
      subject: 'Mathematics',
      question: "If 3x + 7 = 22, what is the value of x?",
      options: ["x = 5", "x = 4", "x = 6", "x = 3"],
      correct: 0
    },
    {
      id: 2,
      subject: 'English',
      question: "Choose the correct spelling:",
      options: ["Recieve", "Receive", "Receve", "Receieve"],
      correct: 1
    },
    {
      id: 3,
      subject: 'Science',
      question: "What is the chemical symbol for water?",
      options: ["H2O", "CO2", "NaCl", "O2"],
      correct: 0
    },
    {
      id: 4,
      subject: 'Mathematics',
      question: "What is 15% of 200?",
      options: ["25", "30", "35", "40"],
      correct: 1
    },
    {
      id: 5,
      subject: 'English',
      question: "What is the plural of 'child'?",
      options: ["childs", "children", "childes", "child's"],
      correct: 1
    },
    {
      id: 6,
      subject: 'Science',
      question: "Which planet is closest to the Sun?",
      options: ["Venus", "Earth", "Mercury", "Mars"],
      correct: 2
    },
    {
      id: 7,
      subject: 'General Knowledge',
      question: "What is the capital of Nigeria?",
      options: ["Lagos", "Abuja", "Kano", "Port Harcourt"],
      correct: 1
    },
    {
      id: 8,
      subject: 'Mathematics',
      question: "What is the area of a rectangle with length 8cm and width 5cm?",
      options: ["40 cm²", "26 cm²", "13 cm²", "35 cm²"],
      correct: 0
    }
  ];

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
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: value
    }));
  };

  const handleFlagQuestion = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const handleSubmitExam = () => {
    const score = examQuestions.reduce((total, question, index) => {
      const userAnswer = parseInt(answers[index]);
      return total + (userAnswer === question.correct ? 1 : 0);
    }, 0);

    const percentage = Math.round((score / examQuestions.length) * 100);
    
    setCurrentStep(3);
    
    toast({
      title: "Exam Completed",
      description: `You scored ${score}/${examQuestions.length} (${percentage}%)`,
    });
  };

  const progress = ((currentQuestion + 1) / examQuestions.length) * 100;
  const currentQ = examQuestions[currentQuestion];

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
                      Total Questions: {examQuestions.length}
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
                  {currentQ.subject}
                </Badge>
                <span className="text-lg font-bold">Question {currentQuestion + 1}/{examQuestions.length}</span>
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
            <Progress value={progress} className="mt-3" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Question Area */}
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-lg leading-relaxed bg-gray-50 p-6 rounded-lg border">
                  {currentQ.question}
                </div>
                
                <RadioGroup
                  value={answers[currentQuestion] || ''}
                  onValueChange={handleAnswerChange}
                  className="space-y-4"
                >
                  {currentQ.options.map((option, index) => (
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
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="bg-orange-500 text-white hover:bg-orange-600"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleFlagQuestion}
                variant={flaggedQuestions.has(currentQuestion) ? "default" : "outline"}
                className={flaggedQuestions.has(currentQuestion) ? "bg-yellow-500 hover:bg-yellow-600" : ""}
              >
                <Flag className="h-4 w-4 mr-2" />
                {flaggedQuestions.has(currentQuestion) ? 'Unflag' : 'Flag'}
              </Button>
              
              <Button
                onClick={() => setCurrentQuestion(Math.min(examQuestions.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === examQuestions.length - 1}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="text-lg font-semibold text-gray-700">
              Attempted: {Object.keys(answers).length}/{examQuestions.length}
            </div>
          </div>

          {/* Question Navigator */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-8 gap-3">
                {examQuestions.map((_, index) => {
                  const isAnswered = answers[index] !== undefined;
                  const isFlagged = flaggedQuestions.has(index);
                  const isCurrent = index === currentQuestion;
                  
                  return (
                    <Button
                      key={index}
                      variant={isCurrent ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentQuestion(index)}
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
