import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCheck, FileUp, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { RichText } from '@/components/RichText';
import { useAuth } from '@/auth/AuthProvider';
import { useSubjects } from '@/hooks/useReferenceData';
import { supabase } from '@/lib/supabase';
import { useQuestions } from '@/features/questions/queries';
import { QuestionEditor } from '@/features/questions/QuestionEditor';
import type { Question } from '@/features/questions/types';

const ALL = '__all__';

export default function QuestionBank() {
  const queryClient = useQueryClient();
  const { profile, can } = useAuth();
  const { data: subjects } = useSubjects();
  const [params, setParams] = useSearchParams();
  const subjectId = params.get('subject') ?? '';
  const status = (params.get('status') ?? '') as '' | 'draft' | 'approved';
  const importId = params.get('import') ?? undefined;
  const questions = useQuestions({ subjectId: importId ? undefined : subjectId, status: status || undefined, importId });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Question | null>(null);

  // Default to the first subject so the page opens on something useful
  useEffect(() => {
    if (!subjectId && !importId && subjects?.length) setParams({ subject: subjects[0].id }, { replace: true });
  }, [subjectId, importId, subjects, setParams]);
  useEffect(() => setSelected(new Set()), [subjectId, status, importId]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.delete('import');
    if (value && value !== ALL) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const canEdit = (q: Question) => q.created_by === profile?.id || can('questions.all');
  const canApprove = (q: Question) => q.created_by === profile?.id || can('questions.approve');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['questions'] });

  const approveSelected = async () => {
    const ids = [...selected];
    const { data, error } = await supabase.rpc('approve_questions', { p_ids: ids });
    if (error) return toast.error(error.message);
    const approved = data as number;
    if (approved < ids.length) {
      toast.warning(`Approved ${approved} of ${ids.length}. The rest are already approved, not yours to approve, or need exactly one correct option.`);
    } else toast.success(`Approved ${approved} questions`);
    setSelected(new Set());
    refresh();
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Delete ${selected.size} questions? Questions already used in an exam cannot be deleted.`)) return;
    const { error } = await supabase.from('questions').delete().in('id', [...selected]);
    if (error) {
      toast.error(error.message.includes('foreign key') ? 'Some questions are used in exams and cannot be deleted.' : error.message);
      return;
    }
    toast.success('Deleted');
    setSelected(new Set());
    refresh();
  };

  const rows = questions.data;
  const allSelected = !!rows?.length && rows.every((q) => selected.has(q.id));
  const toggle = (id: string) => setSelected((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const columns = useMemo<ColumnDef<Question, unknown>[]>(
    () => [
      {
        id: 'select',
        enableSorting: false,
        header: () => (
          <input
            type="checkbox"
            aria-label="Select all"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(rows?.map((q) => q.id)))}
          />
        ),
        cell: ({ row }) => (
          <input type="checkbox" aria-label="Select question" checked={selected.has(row.original.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggle(row.original.id)} />
        ),
      },
      {
        id: 'question',
        header: 'Question',
        accessorFn: (q) => `${q.body} ${q.topic ?? ''}`,
        cell: ({ row }) => (
          <div className="max-w-xl">
            <RichText text={row.original.body.length > 160 ? `${row.original.body.slice(0, 160)}…` : row.original.body} className="line-clamp-2 text-sm" />
            {row.original.passage && <span className="text-xs text-muted-foreground">Passage: {row.original.passage.title || 'untitled'}</span>}
          </div>
        ),
      },
      { id: 'type', header: 'Type', accessorFn: (q) => (q.type === 'mcq' ? 'MCQ' : 'Theory') },
      { accessorKey: 'topic', header: 'Topic' },
      { accessorKey: 'class_level', header: 'Level' },
      { id: 'marks', header: 'Marks', accessorFn: (q) => Number(q.marks) },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (q) => q.status,
        cell: ({ row }) => (row.original.status === 'approved' ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Draft</Badge>),
      },
    ],
    [rows, selected, allSelected],
  );

  const selectedQuestions = rows?.filter((q) => selected.has(q.id)) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question bank"
        description="Questions start as drafts. Approve them after checking; only approved questions can go into an exam."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/staff/questions/import"><FileUp className="mr-2 h-4 w-4" />Import</Link>
            </Button>
            <Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />New question</Button>
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
        {importId ? (
          <Button variant="outline" size="sm" onClick={() => setFilter('import', '')}>Showing one import · show all</Button>
        ) : (
          <Select value={subjectId} onValueChange={(v) => setFilter('subject', v)}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{subjects?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <Select value={status || ALL} onValueChange={(v) => setFilter('status', v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2">
            <span className="text-sm">{selected.size} selected</span>
            <Button size="sm" variant="ghost" onClick={approveSelected} disabled={!selectedQuestions.some(canApprove)}>
              <CheckCheck className="mr-1 h-4 w-4" />Approve
            </Button>
            <Button size="sm" variant="ghost" onClick={deleteSelected} disabled={!selectedQuestions.every(canEdit)}>
              <Trash2 className="mr-1 h-4 w-4" />Delete
            </Button>
          </div>
        )}
      </div>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={questions.isLoading}
        error={questions.error}
        searchPlaceholder="Search question text or topic"
        emptyMessage={subjects?.length === 0 ? 'Add subjects first (Classes and subjects).' : 'No questions yet for this subject.'}
        onRowClick={setViewing}
        pageSize={50}
      />

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {viewing && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {viewing.type === 'mcq' ? 'Multiple choice' : 'Theory'} · {Number(viewing.marks)} {Number(viewing.marks) === 1 ? 'mark' : 'marks'}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                {viewing.passage && (
                  <div className="max-h-48 overflow-y-auto rounded bg-muted p-3 text-xs">
                    <p className="mb-1 font-medium">{viewing.passage.title}</p>
                    <RichText text={viewing.passage.body} />
                  </div>
                )}
                <RichText text={viewing.body} className="leading-relaxed" />
                {viewing.image_url && <img src={viewing.image_url} alt="" className="max-h-56 rounded border" />}
                <ol className="space-y-1">
                  {viewing.options.map((o) => (
                    <li key={o.id} className={`flex gap-2 rounded px-2 py-1 ${o.is_correct ? 'bg-green-100 text-green-900' : ''}`}>
                      <span className="font-semibold">{o.label}.</span>
                      <div>
                        <RichText text={o.body} as="span" />
                        {o.image_url && <img src={o.image_url} alt="" className="mt-1 max-h-24" />}
                      </div>
                    </li>
                  ))}
                </ol>
                {viewing.explanation && (
                  <div className="rounded border p-2 text-xs"><span className="font-medium">Explanation: </span><RichText text={viewing.explanation} as="span" /></div>
                )}
                <div className="flex gap-2">
                  {canEdit(viewing) && <Button onClick={() => { setEditing(viewing); setViewing(null); }}>Edit</Button>}
                  {viewing.status === 'draft' && canApprove(viewing) && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const { data } = await supabase.rpc('approve_questions', { p_ids: [viewing.id] });
                        if (data) toast.success('Approved');
                        else toast.error('Could not approve: an MCQ needs at least two options and exactly one correct answer.');
                        refresh();
                        setViewing(null);
                      }}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <QuestionEditor
        open={creating || !!editing}
        question={editing}
        defaults={{ subject_id: subjectId }}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
