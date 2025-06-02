
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useExam } from '../contexts/ExamContext';
import { TeacherStats } from '../components/teacher/TeacherStats';
import { ExamForm } from '../components/teacher/ExamForm';
import { QuestionForm } from '../components/teacher/QuestionForm';
import { ExamList } from '../components/teacher/ExamList';
import { QuestionList } from '../components/teacher/QuestionList';
import { StudentResults } from '../components/teacher/StudentResults';
import { Analytics } from '../components/teacher/Analytics';

const TeacherDashboard = () => {
  const { exams, questions, addExam, addQuestion, deleteExam, deleteQuestion } = useExam();
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);

  const handleCreateExam = (examData: any) => {
    addExam(examData);
    setShowCreateExam(false);
  };

  const handleCreateQuestion = (questionData: any) => {
    addQuestion(questionData);
    setShowCreateQuestion(false);
  };

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
                <Button onClick={() => setShowCreateQuestion(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

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
