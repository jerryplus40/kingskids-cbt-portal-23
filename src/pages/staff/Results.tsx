import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Printer, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { PrintArea } from '@/components/PrintArea';
import { useAuth } from '@/auth/AuthProvider';
import { useClassSubjects, useClasses, useSchoolSettings, useSessions } from '@/hooks/useReferenceData';
import { usePrint } from '@/hooks/usePrint';
import { invokeFunction, supabase } from '@/lib/supabase';
import { downloadSpreadsheet } from '@/lib/spreadsheet';
import { TERM_LABELS } from '@/types/db';
import { fetchReportCard, useBroadsheet, useReleases, useReportCard, useReportComments } from '@/features/results/queries';
import { summariseBroadsheet, type StudentSummary } from '@/features/results/broadsheet';
import { ReportCard } from '@/features/results/ReportCard';
import { TRAITS, ordinal, type ReportCardData, type ReportComment } from '@/features/results/types';

function CommentsTab({ termId, students, classTeacher }: { termId: string; students: StudentSummary[]; classTeacher: boolean }) {
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const comments = useReportComments(termId, students.map((s) => s.student_id));
  const [editing, setEditing] = useState<StudentSummary | null>(null);
  const [draft, setDraft] = useState<Omit<ReportComment, 'student_id' | 'term_id'>>({ class_teacher_comment: '', principal_comment: '', days_present: null, days_open: null, traits: {} });
  const isPrincipal = can('results.release');
  const byStudent = new Map((comments.data ?? []).map((c) => [c.student_id, c]));

  const open = (s: StudentSummary) => {
    const c = byStudent.get(s.student_id);
    setDraft({
      class_teacher_comment: c?.class_teacher_comment ?? '',
      principal_comment: c?.principal_comment ?? '',
      days_present: c?.days_present ?? null,
      days_open: c?.days_open ?? byStudent.values().next().value?.days_open ?? null,
      traits: c?.traits ?? {},
    });
    setEditing(s);
  };

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase.from('report_comments').upsert({
      student_id: editing.student_id,
      term_id: termId,
      class_teacher_comment: draft.class_teacher_comment || null,
      days_present: draft.days_present,
      days_open: draft.days_open,
      traits: draft.traits,
      // Sending the principal's comment unchanged keeps the class teacher within their permissions
      principal_comment: isPrincipal ? draft.principal_comment || null : byStudent.get(editing.student_id)?.principal_comment ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success('Saved');
    queryClient.invalidateQueries({ queryKey: ['report_comments'] });
    queryClient.invalidateQueries({ queryKey: ['report_card'] });
    // Move to the next student, which suits filling a whole class
    const index = students.findIndex((s) => s.student_id === editing.student_id);
    if (students[index + 1]) open(students[index + 1]);
    else setEditing(null);
  };

  if (!classTeacher && !isPrincipal) {
    return <p className="text-sm text-muted-foreground">Only the class teacher and the principal write report comments.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Class teacher</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const c = byStudent.get(s.student_id);
              return (
                <TableRow key={s.student_id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{c?.days_present != null ? `${c.days_present}/${c.days_open ?? '?'}` : ''}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{c?.class_teacher_comment}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{c?.principal_comment}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => open(s)}>{c ? 'Edit' : 'Write'}</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Average {editing.average.toFixed(2)}% · {ordinal(editing.position)} of {students.length}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:w-80">
                <div className="space-y-1">
                  <Label>Days present</Label>
                  <Input type="number" min={0} value={draft.days_present ?? ''} onChange={(e) => setDraft({ ...draft, days_present: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-1">
                  <Label>Days school opened</Label>
                  <Input type="number" min={0} value={draft.days_open ?? ''} onChange={(e) => setDraft({ ...draft, days_open: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Class teacher's comment</Label>
                <Textarea rows={2} value={draft.class_teacher_comment ?? ''} onChange={(e) => setDraft({ ...draft, class_teacher_comment: e.target.value })} disabled={!classTeacher && !isPrincipal} />
              </div>
              {isPrincipal && (
                <div className="space-y-1">
                  <Label>Principal's comment</Label>
                  <Textarea rows={2} value={draft.principal_comment ?? ''} onChange={(e) => setDraft({ ...draft, principal_comment: e.target.value })} />
                </div>
              )}
              <div className="space-y-2">
                <Label>Behaviour and skills (1–5)</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TRAITS.map((trait) => (
                    <div key={trait} className="flex items-center justify-between gap-2 text-sm">
                      <span>{trait}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`h-7 w-7 rounded border text-xs ${draft.traits[trait] === n ? 'bg-primary text-primary-foreground' : ''}`}
                            onClick={() => setDraft({ ...draft, traits: { ...draft.traits, [trait]: n } })}
                            aria-label={`${trait} ${n}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Close</Button>
                <Button onClick={save}>Save and next</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportCardsTab({ termId, students }: { termId: string; students: StudentSummary[] }) {
  const [studentId, setStudentId] = useState('');
  const selected = studentId || students[0]?.student_id;
  const card = useReportCard(selected, termId);
  const { printing, print } = usePrint();
  const [batch, setBatch] = useState<ReportCardData[]>([]);
  const [loading, setLoading] = useState(false);

  const printAll = async () => {
    setLoading(true);
    try {
      const cards: ReportCardData[] = [];
      for (const s of students) cards.push(await fetchReportCard(s.student_id, termId));
      setBatch(cards);
      // Let React render the batch, then print
      setTimeout(print, 50);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={selected} onValueChange={setStudentId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Student" /></SelectTrigger>
          <SelectContent>{students.map((s) => <SelectItem key={s.student_id} value={s.student_id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setBatch(card.data ? [card.data] : []); setTimeout(print, 50); }} disabled={!card.data}>
          <Printer className="mr-2 h-4 w-4" />Print this one
        </Button>
        <Button onClick={printAll} disabled={loading || students.length === 0}>
          <Printer className="mr-2 h-4 w-4" />{loading ? 'Preparing…' : `Print all ${students.length}`}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">In the print dialog choose A4 and “Save as PDF” to keep a copy.</p>
      <div className="overflow-x-auto rounded-md border bg-muted/30 p-4">
        {card.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {card.data && <ReportCard data={card.data} />}
      </div>
      {printing && (
        <PrintArea>
          {batch.map((data, i) => (
            <div key={data.student.id} className={i < batch.length - 1 ? 'page-break' : undefined}>
              <ReportCard data={data} />
            </div>
          ))}
        </PrintArea>
      )}
    </div>
  );
}

function ReleaseTab({ termId, classId, released }: { termId: string; classId: string; released: boolean }) {
  const queryClient = useQueryClient();
  const sessions = useSessions();
  const term = sessions.data?.flatMap((s) => s.terms).find((t) => t.id === termId);
  const outbox = useQuery({
    queryKey: ['outbox_count'],
    queryFn: async () => (await supabase.from('message_outbox').select('id', { count: 'exact', head: true }).eq('status', 'pending')).count ?? 0,
  });

  const setReleased = async (value: boolean) => {
    const { error } = value
      ? await supabase.from('result_releases').insert({ term_id: termId, class_id: classId })
      : await supabase.from('result_releases').delete().eq('term_id', termId).eq('class_id', classId);
    if (error) return toast.error(error.message);
    toast.success(value ? 'Released. Students and parents have been notified.' : 'Results withdrawn');
    queryClient.invalidateQueries({ queryKey: ['result_releases'] });
    queryClient.invalidateQueries({ queryKey: ['report_card'] });
    queryClient.invalidateQueries({ queryKey: ['outbox_count'] });
  };

  const sendMessages = async () => {
    try {
      const result = await invokeFunction<{ sent: number; failed: number; waiting: number; note?: string }>('send-notifications', {});
      if (result.note) toast.warning(`${result.note}. Messages stay queued until one is set up.`);
      else toast.success(`Sent ${result.sent}${result.failed ? `, ${result.failed} failed` : ''}`);
      queryClient.invalidateQueries({ queryKey: ['outbox_count'] });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{released ? 'Released' : 'Not released'}</CardTitle>
          <CardDescription>
            Releasing shows report cards to students and parents, notifies them in the portal and queues an SMS to each parent.
            Teachers can no longer change scores once released.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {released ? (
            <Button variant="outline" onClick={() => window.confirm('Withdraw these results? Students and parents will no longer see them.') && setReleased(false)}>
              Withdraw release
            </Button>
          ) : (
            <Button onClick={() => window.confirm('Release results for this class?') && setReleased(true)}>Release results</Button>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next term begins</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            className="w-48"
            defaultValue={term?.next_term_begins ?? ''}
            onBlur={async (e) => {
              const { error } = await supabase.from('terms').update({ next_term_begins: e.target.value || null }).eq('id', termId);
              if (error) toast.error(error.message);
              else {
                toast.success('Saved');
                queryClient.invalidateQueries({ queryKey: ['report_card'] });
              }
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Messages to parents</CardTitle>
          <CardDescription>{outbox.data ?? 0} SMS and emails waiting to send.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={sendMessages} disabled={!outbox.data}><Send className="mr-2 h-4 w-4" />Send now</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Results() {
  const { profile, can } = useAuth();
  const { data: settings } = useSchoolSettings();
  const { data: sessions } = useSessions();
  const { data: classes } = useClasses();
  const { data: classSubjects } = useClassSubjects();
  const terms = useMemo(() => sessions?.flatMap((s) => s.terms.map((t) => ({ ...t, label: `${s.name} · ${TERM_LABELS[t.term]}` }))) ?? [], [sessions]);
  const [termId, setTermId] = useState('');
  const [classId, setClassId] = useState('');
  useEffect(() => {
    if (!termId && settings?.current_term_id) setTermId(settings.current_term_id);
  }, [termId, settings]);

  const seesAll = can('results.view_all') || can('scores.all');
  const visibleClasses = (classes ?? []).filter(
    (c) => seesAll || c.class_teacher_id === profile?.id || classSubjects?.some((cs) => cs.class_id === c.id && cs.teacher_id === profile?.id),
  );
  const selectedClass = classes?.find((c) => c.id === classId);
  const isClassTeacher = selectedClass?.class_teacher_id === profile?.id;
  const broadsheet = useBroadsheet(termId, classId);
  const releases = useReleases(termId);
  const released = !!releases.data?.some((r) => r.class_id === classId);
  const { subjects, students } = useMemo(() => summariseBroadsheet(broadsheet.data ?? []), [broadsheet.data]);
  const { printing, print } = usePrint();

  const exportBroadsheet = () =>
    downloadSpreadsheet(
      `Broadsheet ${selectedClass?.name ?? ''}.xlsx`,
      students.map((s) => ({
        position: s.position,
        name: s.name,
        admission_no: s.admission_no,
        ...Object.fromEntries(subjects.map((sub) => [sub, s.scores[sub] ?? ''])),
        total: s.grandTotal,
        average: s.average,
      })),
      'Broadsheet',
    );

  const sheet = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pos.</TableHead>
          <TableHead>Student</TableHead>
          {subjects.map((s) => <TableHead key={s} className="whitespace-nowrap text-center">{s}</TableHead>)}
          <TableHead className="text-center">Total</TableHead>
          <TableHead className="text-center">Average</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s) => (
          <TableRow key={s.student_id}>
            <TableCell>{ordinal(s.position)}</TableCell>
            <TableCell className="whitespace-nowrap font-medium">{s.name}</TableCell>
            {subjects.map((sub) => <TableCell key={sub} className="text-center">{s.scores[sub] ?? '—'}</TableCell>)}
            <TableCell className="text-center font-medium">{s.grandTotal}</TableCell>
            <TableCell className="text-center">{s.average.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Results and report cards" description="Broadsheets, comments, report cards and release, by class." />
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Term</Label>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Choose term" /></SelectTrigger>
            <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Choose class" /></SelectTrigger>
            <SelectContent>{visibleClasses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {classId && termId && (released ? <Badge>Released</Badge> : <Badge variant="outline">Not released</Badge>)}
      </div>

      {termId && classId && (
        <Tabs defaultValue="broadsheet">
          <TabsList className="flex-wrap">
            <TabsTrigger value="broadsheet">Broadsheet</TabsTrigger>
            <TabsTrigger value="comments">Comments and attendance</TabsTrigger>
            <TabsTrigger value="cards">Report cards</TabsTrigger>
            {can('results.release') && <TabsTrigger value="release">Release</TabsTrigger>}
          </TabsList>
          <TabsContent value="broadsheet" className="mt-4 space-y-3">
            {broadsheet.error && (
              <Alert variant="destructive"><AlertDescription>{broadsheet.error.message}</AlertDescription></Alert>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportBroadsheet} disabled={!students.length}><Download className="mr-2 h-4 w-4" />Export</Button>
              <Button variant="outline" onClick={print} disabled={!students.length}><Printer className="mr-2 h-4 w-4" />Print</Button>
            </div>
            <div className="overflow-x-auto rounded-md border">{sheet}</div>
            {!broadsheet.isLoading && students.length === 0 && <p className="text-sm text-muted-foreground">No scores entered for this class and term yet.</p>}
            {printing && (
              <PrintArea className="p-4 text-[11px]">
                <h2 className="mb-2 text-center font-bold">
                  {settings?.school_name} · Broadsheet · {selectedClass?.name} · {terms.find((t) => t.id === termId)?.label}
                </h2>
                {sheet}
              </PrintArea>
            )}
          </TabsContent>
          <TabsContent value="comments" className="mt-4">
            <CommentsTab termId={termId} students={students} classTeacher={isClassTeacher} />
          </TabsContent>
          <TabsContent value="cards" className="mt-4">
            <ReportCardsTab termId={termId} students={students} />
          </TabsContent>
          {can('results.release') && (
            <TabsContent value="release" className="mt-4">
              <ReleaseTab termId={termId} classId={classId} released={released} />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
