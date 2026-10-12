import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, BarChart3, Eye, MonitorPlay, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RichText } from '@/components/RichText';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import { useClasses, useSubjects } from '@/hooks/useReferenceData';
import { supabase } from '@/lib/supabase';
import { useQuestionsByIds } from '@/features/questions/queries';
import type { Question } from '@/features/questions/types';
import { useAttemptCounts, useExam, useExamPaper } from '@/features/exams/queries';
import { COUNTS_AS_LABELS, KIND_LABELS, type CountsAs, type Exam } from '@/features/exams/types';
import { AddQuestionsSheet } from '@/features/exams/AddQuestionsSheet';
import { ExamStatusBadge } from './Exams';

/** ISO time ↔ the value of an <input type="datetime-local"> in the browser's time zone */
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

function SettingsTab({ exam, locked }: { exam: Exam; locked: boolean }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(exam);
  const [saving, setSaving] = useState(false);
  useEffect(() => setValues(exam), [exam]);
  const set = <K extends keyof Exam>(key: K, value: Exam[K]) => setValues((v) => ({ ...v, [key]: value }));

  const save = async () => {
    if (values.opens_at && values.closes_at && values.closes_at <= values.opens_at) {
      toast.error('The closing time must be after the opening time');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('exams')
      .update({
        title: values.title,
        instructions: values.instructions,
        duration_minutes: values.duration_minutes,
        opens_at: values.opens_at,
        closes_at: values.closes_at,
        max_attempts: values.max_attempts,
        shuffle_questions: values.shuffle_questions,
        shuffle_options: values.shuffle_options,
        calculator: values.calculator,
        lockdown: values.lockdown,
        show_score: values.show_score,
        review_allowed: values.review_allowed,
        counts_as: values.counts_as,
      })
      .eq('id', exam.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Exam settings saved');
    queryClient.invalidateQueries({ queryKey: ['exam', exam.id] });
    queryClient.invalidateQueries({ queryKey: ['exams'] });
  };

  const toggle = (key: keyof Exam, label: string, hint: string) => (
    <div className="flex items-start justify-between gap-4 rounded-md border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={values[key] as boolean} onCheckedChange={(v) => set(key, v as never)} />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-4">
      <div className="space-y-1"><Label>Title</Label><Input value={values.title} onChange={(e) => set('title', e.target.value)} /></div>
      <div className="space-y-1">
        <Label>Instructions to candidates</Label>
        <Textarea rows={3} value={values.instructions ?? ''} onChange={(e) => set('instructions', e.target.value)} placeholder="Answer all questions in Section A and any two in Section B." />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label>Duration (min)</Label>
          <Input type="number" min={1} max={600} value={values.duration_minutes} onChange={(e) => set('duration_minutes', Number(e.target.value))} disabled={locked} />
        </div>
        <div className="space-y-1">
          <Label>Attempts allowed</Label>
          <Input
            type="number"
            min={1}
            placeholder="Unlimited"
            value={values.max_attempts ?? ''}
            onChange={(e) => set('max_attempts', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="space-y-1">
          <Label>Opens</Label>
          <Input type="datetime-local" value={toLocalInput(values.opens_at)} onChange={(e) => set('opens_at', fromLocalInput(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label>Closes</Label>
          <Input type="datetime-local" value={toLocalInput(values.closes_at)} onChange={(e) => set('closes_at', fromLocalInput(e.target.value))} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Leave the times empty to allow the exam any time once published. A candidate who starts late still stops at the closing time.</p>
      <div className="space-y-1">
        <Label>Results</Label>
        <Select value={values.counts_as} onValueChange={(v) => set('counts_as', v as CountsAs)}>
          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
          <SelectContent>{(Object.keys(COUNTS_AS_LABELS) as CountsAs[]).map((k) => <SelectItem key={k} value={k}>{COUNTS_AS_LABELS[k]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {toggle('shuffle_questions', 'Shuffle questions', 'Each candidate gets a different order.')}
        {toggle('shuffle_options', 'Shuffle options', 'A–E are reordered per candidate.')}
        {toggle('lockdown', 'Exam lockdown', 'Full screen; leaving the page is recorded and warned.')}
        {toggle('calculator', 'On-screen calculator', 'A basic calculator, as in the UTME.')}
        {toggle('show_score', 'Show score on submit', 'Candidates see their score straight away.')}
        {toggle('review_allowed', 'Allow review after release', 'Candidates see their answers and the correct ones.')}
      </div>
      <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
    </div>
  );
}

function PreviewDialog({ open, onClose, sections }: { open: boolean; onClose: () => void; sections: { title: string; questions: Question[] }[] }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview (unshuffled)</DialogTitle>
        </DialogHeader>
        {sections.map((s, si) => (
          <div key={si} className="space-y-4">
            {s.title && <h3 className="font-semibold">{s.title}</h3>}
            {s.questions.map((q, i) => (
              <div key={q.id} className="space-y-2 border-b pb-4 text-sm">
                {q.passage && <div className="max-h-32 overflow-y-auto rounded bg-muted p-2 text-xs"><RichText text={q.passage.body} /></div>}
                <div className="flex gap-2"><span className="font-semibold">{i + 1}.</span><RichText text={q.body} /></div>
                {q.image_url && <img src={q.image_url} alt="" className="max-h-48" />}
                <ol className="space-y-1 pl-6">
                  {q.options.map((o) => (
                    <li key={o.id} className="flex gap-2"><span className="font-medium">{o.label}.</span><RichText text={o.body} as="span" /></li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
}

export default function ExamBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const exam = useExam(id);
  const paper = useExamPaper(id);
  const counts = useAttemptCounts();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const bank = useQuestionsByIds((paper.data?.questions ?? []).map((q) => q.question_id));
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const byId = useMemo(() => new Map((bank.data ?? []).map((q) => [q.id, q])), [bank.data]);
  if (exam.isLoading || paper.isLoading) return <FullPageSpinner />;
  if (!exam.data) return <p>Exam not found.</p>;
  const e = exam.data;
  const started = (counts.data?.get(e.id)?.started ?? 0) > 0;
  const editable = e.status === 'draft' && !started;
  const sections = paper.data?.sections ?? [];
  const items = paper.data?.questions ?? [];
  const classLevel = classes?.find((c) => c.id === e.class_id)?.level;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['exam_paper', e.id] });
    queryClient.invalidateQueries({ queryKey: ['exam', e.id] });
    queryClient.invalidateQueries({ queryKey: ['exams'] });
  };
  const run = async (action: PromiseLike<{ error: { message: string } | null }>, success?: string) => {
    const { error } = await action;
    if (error) {
      toast.error(error.message);
      return false;
    }
    if (success) toast.success(success);
    refresh();
    return true;
  };

  const addQuestions = async (questions: Question[]) => {
    const sectionId = addingTo!;
    const start = items.filter((i) => i.section_id === sectionId).length;
    await run(
      supabase.from('exam_questions').insert(questions.map((q, i) => ({ exam_id: e.id, section_id: sectionId, question_id: q.id, sort_order: start + i }))),
      `${questions.length} questions added`,
    );
    setAddingTo(null);
  };

  const move = async (sectionId: string, index: number, delta: number) => {
    const list = items.filter((i) => i.section_id === sectionId);
    const a = list[index];
    const b = list[index + delta];
    if (!a || !b) return;
    await supabase.from('exam_questions').update({ sort_order: b.sort_order }).eq('id', a.id);
    await run(supabase.from('exam_questions').update({ sort_order: a.sort_order }).eq('id', b.id));
  };

  const publish = async () => {
    if (await run(supabase.rpc('publish_exam', { p_exam_id: e.id }), 'Published. Candidates can take it in its window.')) return;
  };

  const totalMarks = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    const list = items.filter((i) => i.section_id === sectionId);
    const marks = list.map((i) => Number(i.marks ?? byId.get(i.question_id)?.marks ?? 0));
    if (section?.random_count) {
      // Random draws: the total depends on which questions are drawn; show it when every mark is equal
      return new Set(marks).size <= 1 ? (marks[0] ?? 0) * section.random_count : null;
    }
    return marks.reduce((a, b) => a + b, 0);
  };
  const paperTotal = sections.map((s) => totalMarks(s.id)).reduce<number | null>((a, b) => (a === null || b === null ? null : a + b), 0);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={e.kind === 'entrance' ? '/staff/admissions' : '/staff/exams'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {e.kind === 'entrance' ? 'Admissions' : 'Exams'}
        </Link>
      </Button>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{e.title}</h1>
            <ExamStatusBadge exam={e} />
          </div>
          <p className="text-sm text-muted-foreground">
            {[KIND_LABELS[e.kind], classes?.find((c) => c.id === e.class_id)?.name, subjects?.find((sub) => sub.id === e.subject_id)?.name ?? 'Several subjects', `${e.duration_minutes} minutes`]
              .filter(Boolean)
              .join(' · ')}
            {paperTotal !== null && ` · ${paperTotal} marks`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPreviewing(true)}><Eye className="mr-2 h-4 w-4" />Preview</Button>
          {e.status === 'draft' && <Button onClick={publish}>Publish</Button>}
          {e.status === 'published' && !started && (
            <Button variant="outline" onClick={() => run(supabase.from('exams').update({ status: 'draft' }).eq('id', e.id), 'Back to draft')}>Unpublish</Button>
          )}
          {e.status !== 'draft' && (
            <>
              <Button variant="outline" onClick={() => navigate(`/staff/exams/${e.id}/monitor`)}><MonitorPlay className="mr-2 h-4 w-4" />Monitor</Button>
              <Button variant="outline" onClick={() => navigate(`/staff/exams/${e.id}/results`)}><BarChart3 className="mr-2 h-4 w-4" />Results</Button>
            </>
          )}
          {e.status === 'published' && started && (
            <Button variant="outline" onClick={() => window.confirm('Close the exam? Nobody else can start it.') && run(supabase.from('exams').update({ status: 'closed' }).eq('id', e.id), 'Exam closed')}>
              Close exam
            </Button>
          )}
          {e.status === 'draft' && !started && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete exam"
              onClick={async () => {
                if (!window.confirm('Delete this exam?')) return;
                if (await run(supabase.from('exams').delete().eq('id', e.id), 'Exam deleted')) navigate('/staff/exams');
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!editable && (
        <Alert>
          <AlertDescription>
            {started ? 'Candidates have started this exam, so its questions are fixed.' : 'Unpublish the exam to change its questions.'}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Questions ({items.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="mt-4 space-y-4">
          {sections.map((section, si) => {
            const list = items.filter((i) => i.section_id === section.id);
            const marks = totalMarks(section.id);
            return (
              <Card key={section.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <CardTitle className="text-base">Section {String.fromCharCode(65 + si)}</CardTitle>
                    <Input
                      className="h-8 max-w-xs"
                      placeholder="Section title (optional)"
                      defaultValue={section.title}
                      disabled={!editable}
                      onBlur={(ev) => ev.target.value !== section.title && run(supabase.from('exam_sections').update({ title: ev.target.value }).eq('id', section.id))}
                    />
                    {!e.subject_id && (
                      <Select
                        value={section.subject_id ?? ''}
                        onValueChange={(v) => run(supabase.from('exam_sections').update({ subject_id: v }).eq('id', section.id))}
                        disabled={!editable}
                      >
                        <SelectTrigger className="h-8 w-44"><SelectValue placeholder="Subject" /></SelectTrigger>
                        <SelectContent>{subjects?.map((sub) => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-muted-foreground">Draw</span>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-20"
                        placeholder="all"
                        defaultValue={section.random_count ?? ''}
                        disabled={!editable}
                        onBlur={(ev) => {
                          const value = ev.target.value ? Number(ev.target.value) : null;
                          if (value !== section.random_count) run(supabase.from('exam_sections').update({ random_count: value }).eq('id', section.id));
                        }}
                      />
                      <span className="text-muted-foreground">of {list.length} at random</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{marks !== null ? `${marks} marks` : 'marks vary'}</span>
                </CardHeader>
                <CardContent className="space-y-2">
                  {list.map((item, index) => {
                    const q = byId.get(item.question_id);
                    return (
                      <div key={item.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                        <span className="w-6 pt-1 text-right text-muted-foreground">{index + 1}.</span>
                        <div className="flex-1">
                          {q ? <RichText text={q.body} className="line-clamp-2" /> : <span className="text-muted-foreground">Question not visible</span>}
                          {q && <span className="text-xs text-muted-foreground">{q.type === 'mcq' ? 'MCQ' : 'Theory'}{q.topic && ` · ${q.topic}`}</span>}
                        </div>
                        <Input
                          type="number"
                          min={0.5}
                          step={0.5}
                          className="h-8 w-20"
                          aria-label="Marks"
                          defaultValue={Number(item.marks ?? q?.marks ?? 1)}
                          disabled={!editable}
                          onBlur={(ev) => {
                            const value = Number(ev.target.value);
                            if (value > 0 && value !== Number(item.marks ?? q?.marks)) run(supabase.from('exam_questions').update({ marks: value }).eq('id', item.id));
                          }}
                        />
                        {editable && (
                          <div className="flex">
                            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={index === 0} onClick={() => move(section.id, index, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" disabled={index === list.length - 1} onClick={() => move(section.id, index, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => run(supabase.from('exam_questions').delete().eq('id', item.id))} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {list.length === 0 && <p className="text-sm text-muted-foreground">No questions in this section yet.</p>}
                  {editable && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingTo(section.id)}
                        disabled={!(section.subject_id ?? e.subject_id)}
                        title={!(section.subject_id ?? e.subject_id) ? 'Choose the section subject first' : undefined}
                      >
                        <Plus className="mr-1 h-4 w-4" />Add questions
                      </Button>
                      {sections.length > 1 && list.length === 0 && (
                        <Button variant="ghost" size="sm" onClick={() => run(supabase.from('exam_sections').delete().eq('id', section.id))}>Remove section</Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {editable && (
            <Button
              variant="outline"
              onClick={() => run(supabase.from('exam_sections').insert({ exam_id: e.id, subject_id: e.subject_id, sort_order: sections.length, title: '' }))}
            >
              <Plus className="mr-2 h-4 w-4" />Add section
            </Button>
          )}
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab exam={e} locked={started} />
        </TabsContent>
      </Tabs>

      <AddQuestionsSheet
        open={!!addingTo}
        subjectId={sections.find((sec) => sec.id === addingTo)?.subject_id ?? e.subject_id}
        classLevel={classLevel}
        alreadyIn={new Set(items.map((i) => i.question_id))}
        onClose={() => setAddingTo(null)}
        onAdd={addQuestions}
      />
      <PreviewDialog
        open={previewing}
        onClose={() => setPreviewing(false)}
        sections={sections.map((s) => ({ title: s.title, questions: items.filter((i) => i.section_id === s.id).map((i) => byId.get(i.question_id)).filter(Boolean) as Question[] }))}
      />
    </div>
  );
}
