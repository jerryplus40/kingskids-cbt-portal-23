
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, List } from 'lucide-react';
import { useExam } from '../contexts/ExamContext';
import { TeacherStats } from '../components/teacher/TeacherStats';
import { ExamForm } from '../components/teacher/ExamForm';
import { QuestionForm } from '../components/teacher/QuestionForm';
import { BulkQuestionForm } from '../components/teacher/BulkQuestionForm';
import { ExamList } from '../components/teacher/ExamList';
import { QuestionList } from '../components/teacher/QuestionList';
import { StudentResults } from '../components/teacher/StudentResults';
import { Analytics } from '../components/teacher/Analytics';
import { ExamQuestionEntry } from '../components/teacher/ExamQuestionEntry';

const TeacherDashboard = () => {
  const { exams, questions, addExam, addQuestion, addBulkQuestions, deleteExam, deleteQuestion } = useExam();
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [showBulkQuestions, setShowBulkQuestions] = useState(false);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [showExamQuestionEntry, setShowExamQuestionEntry] = useState(false);

  const handleCreateExam = (examData: any) => {
    const newExam = addExam(examData);
    setShowCreateExam(false);
    // Redirect to question entry for the newly created exam
    setCurrentExamId(newExam.id);
    setShowExamQuestionEntry(true);
  };

  const handleCreateQuestion = (questionData: any) => {
    addQuestion(questionData);
    setShowCreateQuestion(false);
  };

  const handleCreateBulkQuestions = (questionsData: any[]) => {
    addBulkQuestions(questionsData);
    setShowBulkQuestions(false);
  };

  const handleExamQuestionEntryClose = () => {
    setShowExamQuestionEntry(false);
    setCurrentExamId(null);
  };

  const currentExam = currentExamId ? exams.find(exam => exam.id === currentExamId) : null;

  // If showing exam question entry, show that component
  if (showExamQuestionEntry && currentExam) {
    return (
      <Layout title="Add Questions to Exam">
        <div className="px-4 sm:px-0">
          <ExamQuestionEntry 
            exam={currentExam}
            onClose={handleExamQuestionEntryClose}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Teacher Dashboard">
      <div className="px-4 sm:px-0">
        <TeacherStats examCount={exams.length} questionCount={questions.length} />

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
                <ExamForm 
                  onCreateExam={handleCreateExam}
                  onCancel={() => setShowCreateExam(false)}
                />
              )}

              <ExamList exams={exams} onDeleteExam={deleteExam} />
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Question Bank</h2>
                <div className="flex space-x-2">
                  <Button onClick={() => setShowBulkQuestions(true)} className="bg-green-600 hover:bg-green-700">
                    <List className="h-4 w-4 mr-2" />
                    Add Questions 1-60
                  </Button>
                  <Button onClick={() => setShowCreateQuestion(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Single Question
                  </Button>
                </div>
              </div>

              {showBulkQuestions && (
                <BulkQuestionForm 
                  onCreateBulkQuestions={handleCreateBulkQuestions}
                  onCancel={() => setShowBulkQuestions(false)}
                />
              )}

              {showCreateQuestion && (
                <QuestionForm 
                  onCreateQuestion={handleCreateQuestion}
                  onCancel={() => setShowCreateQuestion(false)}
                />
              )}

              <QuestionList questions={questions} onDeleteQuestion={deleteQuestion} />
            </div>
          </TabsContent>

          <TabsContent value="results">
            <StudentResults />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;
