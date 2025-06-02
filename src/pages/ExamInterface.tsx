
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  AlertCircle,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useExam } from '../contexts/ExamContext';

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { exams, getExamQuestions } = useExam();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(5400); // Default 90 minutes
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Get the actual exam and its questions
  const exam = exams.find(e => e.id === examId);
  const examQuestions = examId ? getExamQuestions(examId) : [];

  // Set duration based on actual exam data
  useEffect(() => {
    if (exam && exam.duration) {
      setTimeLeft(exam.duration * 60); // Convert minutes to seconds
    }
  }, [exam]);

  // Redirect if exam not found or has no questions
  useEffect(() => {
    if (!exam) {
      toast({
        title: "Exam Not Found",
        description: "The requested exam could not be found.",
        variant: "destructive"
      });
      navigate('/student');
      return;
    }

    if (examQuestions.length === 0) {
      toast({
        title: "No Questions Available",
        description: "This exam has no questions available.",
        variant: "destructive"
      });
      navigate('/student');
      return;
    }
  }, [exam, examQuestions, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (['a', 'b', 'c', 'd', 'e', 'ArrowLeft', 'ArrowRight'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          handleAnswerChange('A');
          break;
        case 'b':
          handleAnswerChange('B');
          break;
        case 'c':
          handleAnswerChange('C');
          break;
        case 'd':
          handleAnswerChange('D');
          break;
        case 'e':
          handleAnswerChange('E');
          break;
        case 'arrowleft':
          if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
          }
          break;
        case 'arrowright':
          if (currentQuestion < examQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
          }
          break;
        case 'f':
          handleFlagQuestion();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, examQuestions.length]);

  useEffect(() => {
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
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      const userAnswer = answers[index];
      return total + (userAnswer === question.correctAnswer ? 1 : 0);
    }, 0);

    toast({
      title: "Exam Submitted",
      description: `You scored ${score}/${examQuestions.length}`,
    });

    navigate('/student');
  };

  // Return loading state if exam or questions are not available
  if (!exam || examQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / examQuestions.length) * 100;
  const currentQ = examQuestions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">{exam.title}</h1>
              <Badge variant="secondary">{exam.subject}</Badge>
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-bold">Question {currentQuestion + 1}/{examQuestions.length}</span>
              </div>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Main Question Area */}
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
                <div className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-200 transition-all">
                  <RadioGroupItem value="A" id="option-A" className="h-5 w-5" />
                  <Label htmlFor="option-A" className="flex-1 cursor-pointer text-lg">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-bold rounded-full mr-4">
                      A
                    </span>
                    {currentQ.optionA}
                  </Label>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-200 transition-all">
                  <RadioGroupItem value="B" id="option-B" className="h-5 w-5" />
                  <Label htmlFor="option-B" className="flex-1 cursor-pointer text-lg">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-bold rounded-full mr-4">
                      B
                    </span>
                    {currentQ.optionB}
                  </Label>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-200 transition-all">
                  <RadioGroupItem value="C" id="option-C" className="h-5 w-5" />
                  <Label htmlFor="option-C" className="flex-1 cursor-pointer text-lg">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-bold rounded-full mr-4">
                      C
                    </span>
                    {currentQ.optionC}
                  </Label>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-200 transition-all">
                  <RadioGroupItem value="D" id="option-D" className="h-5 w-5" />
                  <Label htmlFor="option-D" className="flex-1 cursor-pointer text-lg">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-bold rounded-full mr-4">
                      D
                    </span>
                    {currentQ.optionD}
                  </Label>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-lg border-2 hover:bg-blue-50 hover:border-blue-200 transition-all">
                  <RadioGroupItem value="E" id="option-E" className="h-5 w-5" />
                  <Label htmlFor="option-E" className="flex-1 cursor-pointer text-lg">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-bold rounded-full mr-4">
                      E
                    </span>
                    {currentQ.optionE}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Navigation and Status Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="bg-orange-500 text-white hover:bg-orange-600 px-6"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={() => setCurrentQuestion(Math.min(examQuestions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === examQuestions.length - 1}
              className="bg-blue-500 hover:bg-blue-600 px-6"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="text-lg font-semibold text-gray-700">
            Attempted: {Object.keys(answers).length}/{examQuestions.length}
          </div>
        </div>

        {/* Question Navigator Grid */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-10 gap-3">
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
                      ${isAnswered ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' : ''}
                      ${isFlagged ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' : ''}
                      ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-600 text-white' : ''}
                      ${!isAnswered && !isFlagged && !isCurrent ? 'bg-gray-100 hover:bg-gray-200' : ''}
                    `}
                  >
                    {index + 1}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts Help */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">
              <strong>Keyboard Shortcuts:</strong> Press A, B, C, D, E to select answers • ← → arrow keys to navigate • F to flag question
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExamInterface;
