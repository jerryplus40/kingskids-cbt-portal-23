import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/auth/AuthProvider';
import { RequireAuth } from '@/auth/RequireAuth';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import type { AppRole } from '@/types/db';

// Each area loads on demand, so the exam screen never downloads admin code
const AppShell = lazy(() => import('./layouts/AppShell').then((m) => ({ default: m.AppShell })));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Apply = lazy(() => import('./pages/entrance/Apply'));
const ApplicationStatus = lazy(() => import('./pages/entrance/Status'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Admissions = lazy(() => import('./pages/staff/Admissions'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/auth/Login'));
const ChangePassword = lazy(() => import('./pages/auth/ChangePassword'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const MfaChallenge = lazy(() => import('./pages/auth/MfaChallenge'));
const Security = lazy(() => import('./pages/auth/Security'));
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const People = lazy(() => import('./pages/admin/People'));
const Academics = lazy(() => import('./pages/admin/Academics'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const StaffHome = lazy(() => import('./pages/staff/StaffHome'));
const QuestionBank = lazy(() => import('./pages/staff/QuestionBank'));
const QuestionImport = lazy(() => import('./pages/staff/QuestionImport'));
const Exams = lazy(() => import('./pages/staff/Exams'));
const ExamBuilder = lazy(() => import('./pages/staff/ExamBuilder'));
const ExamMonitor = lazy(() => import('./pages/staff/ExamMonitor'));
const ExamResults = lazy(() => import('./pages/staff/ExamResults'));
const ExamScreen = lazy(() => import('./pages/exam/ExamScreen'));
const Review = lazy(() => import('./pages/student/Review'));
const Scores = lazy(() => import('./pages/staff/Scores'));
const Results = lazy(() => import('./pages/staff/Results'));
const Reports = lazy(() => import('./pages/student/Reports'));
const ChildPage = lazy(() => import('./pages/parent/ChildPage'));
const StudentHome = lazy(() => import('./pages/student/StudentHome'));
const ParentHome = lazy(() => import('./pages/parent/ParentHome'));
const CandidateHome = lazy(() => import('./pages/candidate/CandidateHome'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const STAFF: AppRole[] = ['admin', 'exam_officer', 'teacher'];

/** Signed-in pages inside the sidebar layout. */
function Shell({ children }: { children?: ReactNode }) {
  return <RequireAuth>{children ?? <AppShell />}</RequireAuth>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <BrowserRouter>
            <Suspense fallback={<FullPageSpinner />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<Navigate to="/" replace />} />
                <Route path="/entrance" element={<Apply />} />
                <Route path="/entrance/status" element={<ApplicationStatus />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/mfa" element={<MfaChallenge />} />
                <Route path="/change-password" element={<RequireAuth><ChangePassword /></RequireAuth>} />
                {/* The exam screen is full-page, outside the sidebar layout */}
                <Route path="/exam/:examId" element={<RequireAuth roles={['student', 'applicant']}><ExamScreen /></RequireAuth>} />

                <Route element={<Shell />}>
                  <Route path="/security" element={<RequireAuth roles={STAFF}><Security /></RequireAuth>} />

                  <Route path="/admin" element={<RequireAuth roles={['admin']}><AdminOverview /></RequireAuth>} />
                  <Route path="/admin/users" element={<RequireAuth permission="users.manage"><People /></RequireAuth>} />
                  <Route path="/admin/academics" element={<RequireAuth permission="academics.manage"><Academics /></RequireAuth>} />
                  <Route path="/admin/settings" element={<RequireAuth permission="settings.manage"><Settings /></RequireAuth>} />
                  <Route path="/admin/audit" element={<RequireAuth permission="audit.view"><AuditLog /></RequireAuth>} />

                  <Route path="/staff" element={<RequireAuth roles={STAFF}><StaffHome /></RequireAuth>} />
                  <Route path="/staff/questions" element={<RequireAuth permission="questions.author"><QuestionBank /></RequireAuth>} />
                  <Route path="/staff/questions/import" element={<RequireAuth permission="questions.author"><QuestionImport /></RequireAuth>} />
                  <Route path="/staff/exams" element={<RequireAuth permission="exams.manage"><Exams /></RequireAuth>} />
                  <Route path="/staff/exams/:id" element={<RequireAuth roles={STAFF}><ExamBuilder /></RequireAuth>} />
                  <Route path="/staff/exams/:id/monitor" element={<RequireAuth permission="exams.invigilate"><ExamMonitor /></RequireAuth>} />
                  <Route path="/staff/exams/:id/results" element={<RequireAuth roles={STAFF}><ExamResults /></RequireAuth>} />
                  <Route path="/staff/scores" element={<RequireAuth permission="scores.enter"><Scores /></RequireAuth>} />
                  <Route path="/staff/results" element={<RequireAuth roles={STAFF}><Results /></RequireAuth>} />
                  <Route path="/staff/admissions" element={<RequireAuth permission="entrance.manage"><Admissions /></RequireAuth>} />

                  <Route path="/student" element={<RequireAuth roles={['student']}><StudentHome /></RequireAuth>} />
                  <Route path="/student/review/:attemptId" element={<RequireAuth roles={['student', 'applicant']}><Review /></RequireAuth>} />
                  <Route path="/student/reports" element={<RequireAuth roles={['student']}><Reports /></RequireAuth>} />
                  <Route path="/parent" element={<RequireAuth roles={['parent']}><ParentHome /></RequireAuth>} />
                  <Route path="/parent/child/:studentId" element={<RequireAuth roles={['parent']}><ChildPage /></RequireAuth>} />
                  <Route path="/candidate" element={<RequireAuth roles={['applicant']}><CandidateHome /></RequireAuth>} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
