
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(5400); // 90 minutes in seconds
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Mock exam data with 5 options
  const examData = {
    subject: 'Mathematics',
    duration: 90,
    questions: [
      {
        id: 1,
        question: "What is the value of x in the equation 2x + 5 = 13?",
        options: ["x = 3", "x = 4", "x = 5", "x = 6", "x = 7"],
        correct: 1
      },
      {
        id: 2,
        question: "Find the area of a circle with radius 7 cm (use π = 22/7)",
        options: ["154 cm²", "144 cm²", "164 cm²", "174 cm²", "184 cm²"],
        correct: 0
      },
      {
        id: 3,
        question: "Simplify: (3x² + 2x - 1) + (x² - 3x + 4)",
        options: ["4x² - x + 3", "4x² + x + 3", "2x² - x + 3", "4x² - x - 3", "3x² - x + 3"],
        correct: 0
      },
      {
        id: 4,
        question: "What is the next term in the sequence: 2, 6, 18, 54, ?",
        options: ["108", "162", "216", "270", "324"],
        correct: 1
      },
      {
        id: 5,
        question: "If sin θ = 3/5, what is cos θ?",
        options: ["4/5", "3/4", "5/4", "5/3", "2/5"],
        correct: 0
      }
    ]
  };

  // Keyboard shortcuts - updated to include E
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default behavior for our shortcuts
      if (['a', 'b', 'c', 'd', 'e', 'ArrowLeft', 'ArrowRight'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }

      switch (event.key.toLowerCase()) {
        case 'a':
          handleAnswerChange('0');
          break;
        case 'b':
          handleAnswerChange('1');
          break;
        case 'c':
          handleAnswerChange('2');
          break;
        case 'd':
          handleAnswerChange('3');
          break;
        case 'e':
          handleAnswerChange('4');
          break;
        case 'arrowleft':
          if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
          }
          break;
        case 'arrowright':
          if (currentQuestion < examData.questions.length - 1) {
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
  }, [currentQuestion, examData.questions.length]);

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
    const score = examData.questions.reduce((total, question, index) => {
      const userAnswer = parseInt(answers[index]);
      return total + (userAnswer === question.correct ? 1 : 0);
    }, 0);

    toast({
      title: "Exam Submitted",
      description: `You scored ${score}/${examData.questions.length}`,
    });

    navigate('/student');
  };

  const progress = ((currentQuestion + 1) / examData.questions.length) * 100;
  const currentQ = examData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">{examData.subject} Examination</h1>
              <div className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-bold">Question {currentQuestion + 1}/{examData.questions.length}</span>
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
              onClick={() => setCurrentQuestion(Math.min(examData.questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === examData.questions.length - 1}
              className="bg-blue-500 hover:bg-blue-600 px-6"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="text-lg font-semibold text-gray-700">
            Attempted: {Object.keys(answers).length}/{examData.questions.length}
          </div>
        </div>

        {/* Question Navigator Grid */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-10 gap-3">
              {examData.questions.map((_, index) => {
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
