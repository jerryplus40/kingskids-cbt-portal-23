import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Calculator, CheckCircle2, ChevronLeft, ChevronRight, CloudOff, Flag, Loader2, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RichText } from '@/components/RichText';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import { useAuth } from '@/auth/AuthProvider';
import { useMyStudent } from '@/hooks/useMyStudent';
import { useSchoolSettings } from '@/hooks/useReferenceData';
import { fullName } from '@/types/db';
import { useMyExams } from '@/features/exams/queries';
import { formatDateTime, windowState, type MyExam, type PaperQuestion } from '@/features/exams/types';
import { useExamSession, type Connection } from '@/features/exam-session/useExamSession';
import { useLockdown } from '@/features/exam-session/useLockdown';
import { formatClock, isAnswered } from '@/features/exam-session/answerQueue';
import { CalculatorPanel } from '@/features/exam-session/CalculatorPanel';

// ---------------------------------------------------------------------------
// Before the clock starts
// ---------------------------------------------------------------------------

function StartScreen({ exam, onStart }: { exam: MyExam; onStart: () => void }) {
  const resuming = !!exam.in_progress_attempt;
  const state = windowState(exam);
  const used = exam.max_attempts !== null && exam.attempts_used >= exam.max_attempts && !resuming;
  const canStart = resuming || (exam.status === 'published' && state === 'open' && !used);

  return (
    <div className="min-h-screen bg-muted/40 px-4 py-10">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{exam.title}</CardTitle>
          <CardDescription>
            {exam.subject} · {exam.duration_minutes} minutes
            {exam.closes_at && ` · closes ${formatDateTime(exam.closes_at)}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {exam.instructions && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-1 font-medium">Instructions</p>
              <p className="whitespace-pre-wrap">{exam.instructions}</p>
            </div>
          )}
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>The timer starts when you press Start and keeps running even if you close the page.</li>
            <li>Every answer is saved as you choose it. If your computer goes off, sign in again and continue.</li>
            <li>Use the numbered boxes to move between questions. Flag a question to come back to it.</li>
            <li>Keyboard: A–E choose an option, N next, P previous, F flag.</li>
            {exam.lockdown && <li>The exam opens in full screen. Leaving it, copying or pasting is recorded for the invigilator.</li>}
            {exam.calculator && <li>A calculator is available from the top bar.</li>}
          </ul>
          {!canStart && (
            <Alert>
              <AlertDescription>
                {used
                  ? 'You have already taken this exam.'
                  : state === 'upcoming'
                    ? `This exam opens ${formatDateTime(exam.opens_at)}.`
                    : 'This exam is closed.'}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/student">Back</Link></Button>
            <Button className="flex-1" size="lg" disabled={!canStart} onClick={onStart}>
              {resuming ? 'Continue exam' : 'Start exam'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The sitting
// ---------------------------------------------------------------------------

function ConnectionPill({ connection, unsaved }: { connection: Connection; unsaved: number }) {
  if (connection === 'offline') {
    return (
      <Badge variant="destructive" className="gap-1" role="status">
        <CloudOff className="h-3 w-3" /> Offline · {unsaved} waiting
      </Badge>
    );
  }
  if (connection === 'saving') {
    return (
      <Badge variant="secondary" className="gap-1" role="status">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1" role="status">
      <CheckCircle2 className="h-3 w-3 text-green-600" /> All saved
    </Badge>
  );
}

const flagsKey = (attemptId: string) => `kk-exam-flags-${attemptId}`;

function Sitting({ exam }: { exam: MyExam }) {
  const { profile } = useAuth();
  const { data: student } = useMyStudent();
  const { data: settings } = useSchoolSettings();
  const session = useExamSession(exam.exam_id);
  const lockdown = useLockdown(exam.lockdown && session.phase === 'writing', session.recordEvent);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [timeAlert, setTimeAlert] = useState<string | null>(null);

  const paper = session.paper;
  const section = paper?.sections[sectionIndex];
  const question: PaperQuestion | undefined = section?.questions[index];
  const allQuestions = useMemo(() => paper?.sections.flatMap((s) => s.questions) ?? [], [paper]);
  const answeredCount = allQuestions.filter((q) => isAnswered(session.answers[q.id])).length;

  // Flags are a personal aid, kept on this device only
  useEffect(() => {
    if (!paper) return;
    try {
      setFlags(new Set(JSON.parse(localStorage.getItem(flagsKey(paper.attempt_id)) ?? '[]')));
    } catch {
      setFlags(new Set());
    }
  }, [paper]);
  const toggleFlag = useCallback(() => {
    if (!question || !paper) return;
    setFlags((f) => {
      const next = new Set(f);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      try {
        localStorage.setItem(flagsKey(paper.attempt_id), JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  }, [question, paper]);

  const go = useCallback(
    (delta: number) => {
      if (!paper || !section) return;
      const next = index + delta;
      if (next >= 0 && next < section.questions.length) setIndex(next);
      else if (delta > 0 && sectionIndex < paper.sections.length - 1) {
        setSectionIndex(sectionIndex + 1);
        setIndex(0);
      } else if (delta < 0 && sectionIndex > 0) {
        setSectionIndex(sectionIndex - 1);
        setIndex(paper.sections[sectionIndex - 1].questions.length - 1);
      }
    },
    [paper, section, index, sectionIndex],
  );

  const choose = useCallback(
    (optionId: string) => question && session.answer(question.id, { option_id: optionId, text: null }),
    [question, session],
  );

  // Keyboard shortcuts (not while typing or in a dialog)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (confirming || target.closest('textarea, input, [role="dialog"], [role="alertdialog"]') || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (question?.type === 'mcq' && 'ABCDE'.includes(key) && key.length === 1) {
        const option = question.options.find((o) => o.label === key);
        if (option) {
          e.preventDefault();
          choose(option.id);
        }
      } else if (key === 'N' || e.key === 'ArrowRight') go(1);
      else if (key === 'P' || e.key === 'ArrowLeft') go(-1);
      else if (key === 'F') toggleFlag();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, confirming, choose, go, toggleFlag]);

  useEffect(() => {
    if (session.phase === 'finished' && document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  }, [session.phase]);

  // Time warnings
  const remaining = session.remaining;
  useEffect(() => {
    if (remaining === 600) setTimeAlert('10 minutes left.');
    if (remaining === 300) setTimeAlert('5 minutes left. Check your flagged and unanswered questions.');
    if (remaining === 60) setTimeAlert('1 minute left. Your answers will be submitted automatically.');
  }, [remaining]);

  if (session.phase === 'loading') return <FullPageSpinner label="Loading your exam" />;
  if (session.phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Cannot open the exam</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{session.error}</p>
            <Button asChild><Link to="/student">Back to my exams</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (session.phase === 'finished') {
    const r = session.result;
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <CardTitle>{r?.reason === 'timeout' ? 'Time is up' : 'Exam submitted'}</CardTitle>
            <CardDescription>{exam.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {r?.score !== null && r?.score !== undefined ? (
              <p className="text-3xl font-semibold">{Number(r.score)} / {Number(r.max_score)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Your answers have been recorded. Your teacher will release the results.</p>
            )}
            {r?.needs_marking && <p className="text-sm text-muted-foreground">Written answers will be marked by your teacher.</p>}
            <Button asChild className="w-full"><Link to="/student">Back to my exams</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!paper || !section || !question) return <FullPageSpinner />;

  const number = paper.sections.slice(0, sectionIndex).reduce((n, s) => n + s.questions.length, 0) + index + 1;
  const answer = session.answers[question.id];
  const unanswered = allQuestions.length - answeredCount;
  const flaggedCount = allQuestions.filter((q) => flags.has(q.id)).length;
  const lowTime = remaining !== null && remaining <= 300;

  return (
    <div className="flex min-h-screen select-none flex-col bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="" className="h-11 w-11 rounded object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded bg-primary text-sm font-semibold text-primary-foreground">
                {profile?.first_name[0]}{profile?.last_name[0]}
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <div className="truncate font-semibold">{profile && fullName(profile)}</div>
              <div className="truncate text-xs text-muted-foreground">
                {student?.admission_no ?? profile?.login_id} · {exam.title}
              </div>
            </div>
          </div>
          <ConnectionPill connection={session.connection} unsaved={session.unsaved} />
          {exam.calculator && (
            <Button variant="outline" size="sm" onClick={() => setCalculatorOpen((o) => !o)}><Calculator className="mr-1 h-4 w-4" />Calculator</Button>
          )}
          <div
            className={`rounded-md px-3 py-1 font-mono text-2xl font-semibold tabular-nums ${lowTime ? 'bg-destructive text-destructive-foreground' : 'bg-muted'}`}
            role="timer"
            aria-label="Time left"
          >
            {remaining !== null ? formatClock(remaining) : '--:--'}
          </div>
          <Button onClick={() => setConfirming(true)} disabled={session.phase === 'submitting'}>
            {session.phase === 'submitting' ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </header>

      {(lockdown.warning || timeAlert || session.error) && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-3">
          <Alert variant={session.error ? 'destructive' : 'default'} className="flex items-start justify-between gap-2">
            <div className="flex gap-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{session.error ?? lockdown.warning ?? timeAlert}</AlertDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { session.clearError(); lockdown.dismissWarning(); setTimeAlert(null); }}>OK</Button>
          </Alert>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-4 lg:grid-cols-[1fr_300px]">
        {/* Question */}
        <main className="space-y-4">
          {paper.sections.length > 1 && (
            <div className="flex flex-wrap gap-2" role="tablist">
              {paper.sections.map((s, i) => (
                <Button key={s.id} role="tab" aria-selected={i === sectionIndex} variant={i === sectionIndex ? 'default' : 'outline'} size="sm" onClick={() => { setSectionIndex(i); setIndex(0); }}>
                  {s.title || `Section ${String.fromCharCode(65 + i)}`}
                </Button>
              ))}
            </div>
          )}
          {section.instructions && <p className="text-sm text-muted-foreground">{section.instructions}</p>}
          <Card>
            <CardContent className="space-y-5 p-5 md:p-8">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Question {number} of {allQuestions.length}</span>
                <span>{question.marks} {question.marks === 1 ? 'mark' : 'marks'}</span>
              </div>
              {question.passage && (
                <div className="max-h-64 overflow-y-auto rounded-md border bg-muted/40 p-4 text-[15px] leading-relaxed">
                  {question.passage.title && <p className="mb-2 font-semibold">{question.passage.title}</p>}
                  <RichText text={question.passage.body} />
                </div>
              )}
              <RichText text={question.body} className="text-lg leading-relaxed" />
              {question.image_url && <img src={question.image_url} alt="Diagram for this question" className="max-h-80 rounded border bg-white" />}

              {question.type === 'mcq' ? (
                <div className="space-y-3" role="radiogroup" aria-label={`Options for question ${number}`}>
                  {question.options.map((o) => {
                    const selected = answer?.option_id === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => choose(o.id)}
                        className={`flex w-full items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                          selected ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/40'
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {o.label}
                        </span>
                        <span className="pt-1 text-base">
                          <RichText text={o.body} as="span" />
                          {o.image_url && <img src={o.image_url} alt="" className="mt-2 max-h-40" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1">
                  <Textarea
                    rows={10}
                    className="select-text text-base"
                    value={answer?.text ?? ''}
                    onChange={(e) => session.typeAnswer(question.id, e.target.value)}
                    placeholder="Type your answer here"
                    aria-label={`Answer to question ${number}`}
                    maxLength={20000}
                  />
                  <p className="text-right text-xs text-muted-foreground">{(answer?.text ?? '').trim().split(/\s+/).filter(Boolean).length} words</p>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="lg" onClick={() => go(-1)} disabled={sectionIndex === 0 && index === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />Previous
            </Button>
            <Button variant={flags.has(question.id) ? 'secondary' : 'ghost'} onClick={toggleFlag}>
              <Flag className={`mr-1 h-4 w-4 ${flags.has(question.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
              {flags.has(question.id) ? 'Flagged' : 'Flag'}
            </Button>
            <Button size="lg" onClick={() => go(1)} disabled={sectionIndex === paper.sections.length - 1 && index === section.questions.length - 1}>
              Next<ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </main>

        {/* Palette */}
        <aside className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex justify-between text-sm">
                <span>{answeredCount} answered</span>
                <span className="text-muted-foreground">{unanswered} left</span>
              </div>
              {paper.sections.map((s, si) => {
                const offset = paper.sections.slice(0, si).reduce((n, x) => n + x.questions.length, 0);
                return (
                  <div key={s.id} className="space-y-1">
                    {paper.sections.length > 1 && <p className="text-xs font-medium text-muted-foreground">{s.title || `Section ${String.fromCharCode(65 + si)}`}</p>}
                    <div className="grid grid-cols-6 gap-1.5">
                      {s.questions.map((q, qi) => {
                        const current = si === sectionIndex && qi === index;
                        const done = isAnswered(session.answers[q.id]);
                        const flagged = flags.has(q.id);
                        return (
                          <button
                            key={q.id}
                            onClick={() => { setSectionIndex(si); setIndex(qi); }}
                            aria-label={`Question ${offset + qi + 1}${done ? ', answered' : ''}${flagged ? ', flagged' : ''}`}
                            aria-current={current}
                            className={`relative h-9 rounded text-sm font-medium ${
                              done ? 'bg-green-600 text-white' : 'border bg-background'
                            } ${current ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                          >
                            {offset + qi + 1}
                            {flagged && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-1 ring-background" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="flex flex-wrap gap-3 border-t pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-green-600" />Answered</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border" />Not answered</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Flagged</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {calculatorOpen && <CalculatorPanel onClose={() => setCalculatorOpen(false)} />}

      {lockdown.outOfFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-4">
          <Card className="max-w-sm text-center">
            <CardHeader>
              <CardTitle>Return to full screen</CardTitle>
              <CardDescription>Leaving full screen has been recorded. Your time is still running.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" onClick={lockdown.enterFullscreen}><Maximize className="mr-2 h-4 w-4" />Continue in full screen</Button>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your exam?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>You have answered {answeredCount} of {allQuestions.length} questions.</p>
                {unanswered > 0 && <p className="font-medium text-destructive">{unanswered} questions are not answered.</p>}
                {flaggedCount > 0 && <p>{flaggedCount} questions are flagged for review.</p>}
                {session.unsaved > 0 && <p className="font-medium text-destructive">{session.unsaved} answers are still waiting to save.</p>}
                <p>After you submit you cannot change your answers.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={() => session.submit('candidate')}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <span className="sr-only">{settings?.school_name}</span>
    </div>
  );
}

export default function ExamScreen() {
  const { examId } = useParams<{ examId: string }>();
  const myExams = useMyExams();
  const [started, setStarted] = useState(false);
  const exam = myExams.data?.find((e) => e.exam_id === examId);

  if (myExams.isLoading) return <FullPageSpinner />;
  if (!exam) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Exam not available</CardTitle></CardHeader>
          <CardContent><Button asChild><Link to="/student">Back to my exams</Link></Button></CardContent>
        </Card>
      </div>
    );
  }
  if (!started) {
    return (
      <StartScreen
        exam={exam}
        onStart={() => {
          // Full screen needs the click itself, so request it here, before the paper loads
          if (exam.lockdown) document.documentElement.requestFullscreen?.().catch(() => undefined);
          setStarted(true);
        }}
      />
    );
  }
  return <Sitting exam={exam} />;
}
