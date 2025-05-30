
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
  CheckCircle2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(5400); // 90 minutes in seconds
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Mock exam data
  const examData = {
    subject: 'Mathematics',
    duration: 90,
    questions: [
      {
        id: 1,
        question: "What is the value of x in the equation 2x + 5 = 13?",
        options: ["x = 3", "x = 4", "x = 5", "x = 6"],
        correct: 1
      },
      {
        id: 2,
        question: "Find the area of a circle with radius 7 cm (use π = 22/7)",
        options: ["154 cm²", "144 cm²", "164 cm²", "174 cm²"],
        correct: 0
      },
      {
        id: 3,
        question: "Simplify: (3x² + 2x - 1) + (x² - 3x + 4)",
        options: ["4x² - x + 3", "4x² + x + 3", "2x² - x + 3", "4x² - x - 3"],
        correct: 0
      },
      {
        id: 4,
        question: "What is the next term in the sequence: 2, 6, 18, 54, ?",
        options: ["108", "162", "216", "270"],
        correct: 1
      },
      {
        id: 5,
        question: "If sin θ = 3/5, what is cos θ?",
        options: ["4/5", "3/4", "5/4", "5/3"],
        correct: 0
      }
    ]
  };

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
            <div>
              <h1 className="text-xl font-semibold">{examData.subject} Examination</h1>
              <p className="text-gray-600">Question {currentQuestion + 1} of {examData.questions.length}</p>
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
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    Question {currentQuestion + 1}
                    {flaggedQuestions.has(currentQuestion) && (
                      <Badge variant="outline" className="ml-2">
                        <Flag className="h-3 w-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFlagQuestion}
                    className={flaggedQuestions.has(currentQuestion) ? 'text-orange-600' : ''}
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed">{currentQ.question}</p>
                  
                  <RadioGroup
                    value={answers[currentQuestion] || ''}
                    onValueChange={handleAnswerChange}
                  >
                    {currentQ.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={() => setCurrentQuestion(Math.min(examData.questions.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === examData.questions.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
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
                          relative h-10 w-10 p-0
                          ${isAnswered ? 'bg-green-100 border-green-300 text-green-800' : ''}
                          ${isFlagged ? 'bg-orange-100 border-orange-300 text-orange-800' : ''}
                          ${isCurrent ? 'ring-2 ring-blue-500' : ''}
                        `}
                      >
                        {index + 1}
                        {isAnswered && (
                          <CheckCircle2 className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
                        )}
                        {isFlagged && (
                          <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-600" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded mr-2"></div>
                    <span>Flagged</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 border border-gray-300 rounded mr-2"></div>
                    <span>Not Visited</span>
                  </div>
                </div>

                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center text-blue-800 mb-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span className="font-medium">Exam Status</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p>Answered: {Object.keys(answers).length}/{examData.questions.length}</p>
                    <p>Flagged: {flaggedQuestions.size}</p>
                    <p>Time Remaining: {formatTime(timeLeft)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;
