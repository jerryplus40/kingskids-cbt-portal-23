import { Link } from 'react-router-dom';
import { Clock, PlayCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/auth/AuthProvider';
import { useMyStudent } from '@/hooks/useMyStudent';
import { useMyExams } from '@/features/exams/queries';
import { KIND_LABELS, formatDateTime, windowState, type MyExam } from '@/features/exams/types';

function ExamCard({ exam }: { exam: MyExam }) {
  const state = windowState(exam);
  const used = exam.max_attempts !== null && exam.attempts_used >= exam.max_attempts;
  const action = exam.in_progress_attempt ? 'Continue' : !used && state === 'open' && exam.status === 'published' ? 'Start' : null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{exam.title}</CardTitle>
          <Badge variant="outline">{KIND_LABELS[exam.kind]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{exam.subject} · {exam.duration_minutes} minutes</p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          {exam.in_progress_attempt
            ? 'In progress'
            : state === 'upcoming'
              ? `Opens ${formatDateTime(exam.opens_at)}`
              : exam.closes_at && state === 'open'
                ? `Closes ${formatDateTime(exam.closes_at)}`
                : state === 'closed' || exam.status === 'closed'
                  ? 'Closed'
                  : 'Open now'}
        </span>
        {action && (
          <Button asChild size="sm">
            <Link to={`/exam/${exam.exam_id}`}><PlayCircle className="mr-1 h-4 w-4" />{action}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentHome() {
  const { profile } = useAuth();
  const { data: student } = useMyStudent();
  const exams = useMyExams();
  const all = exams.data ?? [];
  const canTake = (e: MyExam) =>
    !!e.in_progress_attempt ||
    (e.status === 'published' && windowState(e) !== 'closed' && (e.max_attempts === null || e.attempts_used < e.max_attempts));
  const current = all.filter(canTake);
  const done = all.filter((e) => e.last_submitted_at);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${profile?.first_name}`}
        description={student ? `${student.admission_no}${student.class ? ` · ${student.class.name}` : ''}` : undefined}
      />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Exams to take</h2>
        {exams.isLoading && <Skeleton className="h-28 w-full" />}
        {!exams.isLoading && current.length === 0 && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No exams are open for you right now.</CardContent></Card>
        )}
        <div className="grid gap-3 md:grid-cols-2">{current.map((e) => <ExamCard key={e.exam_id} exam={e} />)}</div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Completed</h2>
        {done.length === 0 && <p className="text-sm text-muted-foreground">Exams you finish appear here.</p>}
        <div className="overflow-hidden rounded-md border">
          {done.map((e) => (
            <div key={e.exam_id} className="flex flex-wrap items-center justify-between gap-2 border-b p-3 text-sm last:border-b-0">
              <div>
                <div className="font-medium">{e.title}</div>
                <div className="text-muted-foreground">{e.subject} · {formatDateTime(e.last_submitted_at)}</div>
              </div>
              <div className="flex items-center gap-3">
                {e.score !== null ? (
                  <span className="font-semibold">{Number(e.score)} / {Number(e.max_score)}</span>
                ) : (
                  <span className="text-muted-foreground">Result not released</span>
                )}
                {e.results_released && e.review_allowed && e.last_attempt_id && (
                  <Button asChild size="sm" variant="outline"><Link to={`/student/review/${e.last_attempt_id}`}>Review</Link></Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
