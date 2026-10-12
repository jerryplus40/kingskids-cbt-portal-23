import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { supabase, unwrap } from '@/lib/supabase';
import { downloadSpreadsheet } from '@/lib/spreadsheet';
import { fullName, type Profile } from '@/types/db';
import { useExam } from '@/features/exams/queries';
import { AnswerScript } from '@/features/exams/AnswerScript';
import { ItemAnalysis } from '@/features/exams/ItemAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Review } from '@/features/exams/types';

interface AttemptRow {
  id: string;
  candidate_id: string;
  attempt_no: number;
  status: 'in_progress' | 'submitted';
  started_at: string;
  submitted_at: string | null;
  submit_reason: string | null;
  score: number | null;
  max_score: number;
  needs_marking: boolean;
  candidate: Pick<Profile, 'first_name' | 'last_name' | 'other_name' | 'login_id'>;
}

const REASONS: Record<string, string> = { candidate: 'Submitted', timeout: 'Time ran out', invigilator: 'Submitted by invigilator' };
const percent = (row: AttemptRow) => (row.max_score > 0 && row.score !== null ? Math.round((Number(row.score) / Number(row.max_score)) * 100) : null);

export default function ExamResults() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const exam = useExam(id);
  const [scriptFor, setScriptFor] = useState<AttemptRow | null>(null);

  const attempts = useQuery({
    queryKey: ['exam_attempts', id],
    enabled: !!id,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('attempts')
          .select('id, candidate_id, attempt_no, status, started_at, submitted_at, submit_reason, score, max_score, needs_marking, candidate:profiles!attempts_candidate_id_fkey(first_name, last_name, other_name, login_id)')
          .eq('exam_id', id!)
          .order('submitted_at', { ascending: true }),
      ) as unknown as AttemptRow[],
  });
  const script = useQuery({
    queryKey: ['review', scriptFor?.id],
    enabled: !!scriptFor,
    queryFn: async () => unwrap(await supabase.rpc('review_attempt', { p_attempt_id: scriptFor!.id })) as Review,
  });

  const rows = attempts.data ?? [];
  const submitted = rows.filter((r) => r.status === 'submitted');
  const scores = submitted.map(percent).filter((p): p is number => p !== null);
  const toMark = submitted.filter((r) => r.needs_marking).length;
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const updateExam = async (fields: Record<string, boolean>, message: string) => {
    const { error } = await supabase.from('exams').update(fields).eq('id', id!);
    if (error) return toast.error(error.message);
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ['exam', id] });
  };

  const mark = async (questionId: string, marks: number, comment: string) => {
    const { error } = await supabase.rpc('mark_answer', { p_attempt_id: scriptFor!.id, p_question_id: questionId, p_marks: marks, p_comment: comment || null });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Marked');
    queryClient.invalidateQueries({ queryKey: ['review', scriptFor!.id] });
    queryClient.invalidateQueries({ queryKey: ['exam_attempts', id] });
  };

  const exportResults = () =>
    downloadSpreadsheet(
      `${exam.data?.title ?? 'results'}.xlsx`,
      submitted.map((r) => ({
        name: fullName(r.candidate),
        login: r.candidate.login_id,
        attempt: r.attempt_no,
        score: Number(r.score),
        out_of: Number(r.max_score),
        percent: percent(r),
        marking_pending: r.needs_marking ? 'yes' : '',
        submitted: r.submitted_at ? new Date(r.submitted_at).toLocaleString('en-NG') : '',
        how: REASONS[r.submit_reason ?? ''] ?? '',
      })),
      'Results',
    );

  const columns: ColumnDef<AttemptRow, unknown>[] = [
    { id: 'name', header: 'Candidate', accessorFn: (r) => fullName(r.candidate), cell: ({ row }) => <span className="font-medium">{fullName(row.original.candidate)}</span> },
    { id: 'login', header: 'Admission no.', accessorFn: (r) => r.candidate.login_id ?? '' },
    { id: 'score', header: 'Score', accessorFn: (r) => Number(r.score ?? -1), cell: ({ row }) => (row.original.status === 'submitted' ? `${Number(row.original.score)} / ${Number(row.original.max_score)}` : '—') },
    { id: 'percent', header: '%', accessorFn: (r) => percent(r) ?? -1, cell: ({ row }) => (row.original.status === 'submitted' ? `${percent(row.original)}%` : '') },
    {
      id: 'state',
      header: 'Status',
      accessorFn: (r) => r.status,
      cell: ({ row }) =>
        row.original.status === 'in_progress' ? (
          <Badge className="bg-green-600 hover:bg-green-600">Writing</Badge>
        ) : row.original.needs_marking ? (
          <Badge className="bg-amber-500 hover:bg-amber-500">Needs marking</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">{REASONS[row.original.submit_reason ?? '']}</span>
        ),
    },
    { id: 'attempt', header: 'Attempt', accessorFn: (r) => r.attempt_no },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/staff/exams/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Exam</Link>
      </Button>
      <PageHeader
        title={`Results: ${exam.data?.title ?? ''}`}
        actions={<Button variant="outline" onClick={exportResults} disabled={!submitted.length}><Download className="mr-2 h-4 w-4" />Export</Button>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Submitted', submitted.length],
          ['Average', average === null ? '—' : `${average}%`],
          ['Highest', scores.length ? `${Math.max(...scores)}%` : '—'],
          ['To mark', toMark],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      {exam.data && (
        <Card>
          <CardContent className="flex flex-wrap gap-6 pt-6">
            <div className="flex items-center gap-2">
              <Switch
                id="release"
                checked={exam.data.results_released}
                onCheckedChange={(v) => {
                  if (v && toMark > 0 && !window.confirm(`${toMark} scripts still need marking. Release anyway?`)) return;
                  updateExam({ results_released: v }, v ? 'Results released to students and parents' : 'Results hidden');
                }}
              />
              <Label htmlFor="release">Results released to students and parents</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="review" checked={exam.data.review_allowed} onCheckedChange={(v) => updateExam({ review_allowed: v }, v ? 'Review allowed' : 'Review turned off')} />
              <Label htmlFor="review">Students may review answers after release</Label>
            </div>
          </CardContent>
        </Card>
      )}
      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="items">Question analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="candidates" className="mt-4">
          <DataTable
            columns={columns}
            data={rows}
            isLoading={attempts.isLoading}
            error={attempts.error}
            searchPlaceholder="Search candidate"
            emptyMessage="Nobody has started this exam yet."
            onRowClick={(r) => r.status === 'submitted' && setScriptFor(r)}
            pageSize={50}
          />
        </TabsContent>
        <TabsContent value="items" className="mt-4">{id && <ItemAnalysis examId={id} />}</TabsContent>
      </Tabs>
      <Sheet open={!!scriptFor} onOpenChange={(o) => !o && setScriptFor(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {scriptFor && fullName(scriptFor.candidate)}
              {script.data && ` · ${Number(script.data.score)} / ${Number(script.data.max_score)}`}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {script.isLoading && <p className="text-sm text-muted-foreground">Loading script…</p>}
            {script.data && <AnswerScript review={script.data} onMark={mark} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
