import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { SearchSelect } from '@/components/SearchSelect';
import { useAuth } from '@/auth/AuthProvider';
import { useClassSubjects, useClasses, useSchoolSettings, useSubjects } from '@/hooks/useReferenceData';
import { supabase } from '@/lib/supabase';
import { useAttemptCounts, useExams } from '@/features/exams/queries';
import { KIND_LABELS, formatDateTime, windowState, type Exam, type ExamKind } from '@/features/exams/types';

export function ExamStatusBadge({ exam }: { exam: Exam }) {
  if (exam.status === 'draft') return <Badge variant="outline">Draft</Badge>;
  if (exam.status === 'closed') return <Badge variant="secondary">Closed</Badge>;
  const state = windowState(exam);
  if (state === 'upcoming') return <Badge className="bg-amber-500 hover:bg-amber-500">Scheduled</Badge>;
  if (state === 'closed') return <Badge variant="secondary">Window ended</Badge>;
  return <Badge className="bg-green-600 hover:bg-green-600">Open</Badge>;
}

function CreateExamDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { profile, can } = useAuth();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const { data: classSubjects } = useClassSubjects();
  const { data: settings } = useSchoolSettings();
  const [form, setForm] = useState({ title: '', kind: 'test' as ExamKind, class_id: '', subject_id: '', duration: 40 });
  const [saving, setSaving] = useState(false);

  // Any teacher may set an exam for any class and subject; the classes and subjects
  // they are assigned are listed first, as the likeliest choices
  const mine = useMemo(() => (classSubjects ?? []).filter((cs) => cs.teacher_id === profile?.id), [classSubjects, profile?.id]);
  const mineFirst = <T extends { id: string; name: string }>(items: T[] | undefined, isMine: (item: T) => boolean) =>
    [...(items ?? [])].sort((a, b) => Number(isMine(b)) - Number(isMine(a)));
  const classOptions = mineFirst(classes, (c) => mine.some((cs) => cs.class_id === c.id));
  const subjectOptions = mineFirst(subjects, (sub) => mine.some((cs) => cs.subject_id === sub.id && (!form.class_id || cs.class_id === form.class_id)));

  const create = async () => {
    if (!form.title.trim() || !form.class_id || !form.subject_id) {
      toast.error('Give the exam a title, class and subject');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('exams')
      .insert({
        title: form.title.trim(),
        kind: form.kind,
        class_id: form.class_id,
        subject_id: form.subject_id,
        term_id: settings?.current_term_id ?? null,
        duration_minutes: form.duration,
        created_by: profile!.id,
        // Practice papers: unlimited attempts, instant score and review
        ...(form.kind === 'practice' ? { max_attempts: null, show_score: true, results_released: true, review_allowed: true, lockdown: false } : {}),
        ...(form.kind === 'exam' ? { counts_as: 'exam' } : {}),
      })
      .select('id')
      .single();
    if (error) {
      setSaving(false);
      toast.error(error.message.includes('row-level') ? 'Your account cannot create exams. Ask an administrator.' : error.message);
      return;
    }
    await supabase.from('exam_sections').insert({ exam_id: data.id, title: '', subject_id: form.subject_id });
    setSaving(false);
    onClose();
    navigate(`/staff/exams/${data.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New exam</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input placeholder="First term mathematics examination" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Kind</Label>
              <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as ExamKind })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['test', 'exam', 'practice'] as ExamKind[]).map((k) => <SelectItem key={k} value={k}>{KIND_LABELS[k]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={1} max={600} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exam-class">Class</Label>
              <SearchSelect
                id="exam-class"
                value={form.class_id}
                onChange={(v) => setForm({ ...form, class_id: v })}
                options={classOptions.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Choose class"
                searchPlaceholder="Type a class, e.g. JC1"
                emptyText="No class matches."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="exam-subject">Subject</Label>
              <SearchSelect
                id="exam-subject"
                value={form.subject_id}
                onChange={(v) => setForm({ ...form, subject_id: v })}
                options={subjectOptions.map((sub) => ({ value: sub.id, label: sub.name }))}
                placeholder="Choose subject"
                searchPlaceholder="Type a subject, e.g. Mat"
                emptyText="No subject matches."
              />
            </div>
          </div>
          {(classes?.length === 0 || subjects?.length === 0) && (
            <p className="text-sm text-muted-foreground">Add classes and subjects first, under Classes and subjects.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={create} disabled={saving}>{saving ? 'Creating…' : 'Create and add questions'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Exams() {
  const navigate = useNavigate();
  const { profile, can } = useAuth();
  const exams = useExams();
  const counts = useAttemptCounts();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const [creating, setCreating] = useState(false);
  const [scope, setScope] = useState<'mine' | 'all'>(can('exams.all') ? 'all' : 'mine');

  const className = (id: string | null) => classes?.find((c) => c.id === id)?.name ?? '';
  const subjectName = (id: string | null) => subjects?.find((s) => s.id === id)?.name ?? 'Several subjects';
  const visible = exams.data?.filter((e) => e.kind !== 'entrance' && (scope === 'all' || e.created_by === profile?.id));

  const columns: ColumnDef<Exam, unknown>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-medium">{row.original.title}</span> },
    { id: 'class', header: 'Class', accessorFn: (e) => className(e.class_id) },
    { id: 'subject', header: 'Subject', accessorFn: (e) => subjectName(e.subject_id) },
    { id: 'kind', header: 'Kind', accessorFn: (e) => KIND_LABELS[e.kind] },
    { id: 'opens', header: 'Opens', accessorFn: (e) => e.opens_at ?? '', cell: ({ row }) => formatDateTime(row.original.opens_at) || 'Any time' },
    {
      id: 'taken',
      header: 'Submitted',
      accessorFn: (e) => counts.data?.get(e.id)?.submitted ?? 0,
    },
    { id: 'status', header: 'Status', accessorFn: (e) => e.status, cell: ({ row }) => <ExamStatusBadge exam={row.original} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Build papers from approved questions, schedule them, then supervise and release results."
        actions={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />New exam</Button>}
      />
      <DataTable
        columns={columns}
        data={visible}
        isLoading={exams.isLoading}
        error={exams.error}
        searchPlaceholder="Search title, class or subject"
        emptyMessage="No exams yet."
        onRowClick={(e) => navigate(`/staff/exams/${e.id}`)}
        toolbar={
          <Select value={scope} onValueChange={(v) => setScope(v as 'mine' | 'all')}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mine">My exams</SelectItem>
              <SelectItem value="all">All exams</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <CreateExamDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
