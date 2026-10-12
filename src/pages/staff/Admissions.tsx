import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Pencil, Plus, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { PrintArea } from '@/components/PrintArea';
import { useAuth } from '@/auth/AuthProvider';
import { useSchoolSettings } from '@/hooks/useReferenceData';
import { usePrint } from '@/hooks/usePrint';
import { invokeFunction, supabase, unwrap } from '@/lib/supabase';
import { downloadSpreadsheet } from '@/lib/spreadsheet';
import { useExam } from '@/features/exams/queries';
import { formatDateTime } from '@/features/exams/types';
import { STATUS_LABELS, naira, type Applicant, type ApplicantStatus, type EntranceCycle } from '@/features/entrance/api';

const ALL = '__all__';

interface Slip {
  application_no: string;
  name: string;
  password: string | null;
}

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : '');

function CycleDialog({ cycle, open, onClose }: { cycle: EntranceCycle | null; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState({ title: '', class_level: 'JSS1', fee: '0', opens_at: '', closes_at: '', is_open: false, instructions: '' });
  useEffect(() => {
    if (!open) return;
    setValues(
      cycle
        ? {
            title: cycle.title, class_level: cycle.class_level, fee: String(cycle.fee_kobo / 100), opens_at: toLocal(cycle.opens_at),
            closes_at: toLocal(cycle.closes_at), is_open: cycle.is_open, instructions: cycle.instructions ?? '',
          }
        : { title: '', class_level: 'JSS1', fee: '0', opens_at: '', closes_at: '', is_open: false, instructions: '' },
    );
  }, [open, cycle]);

  const save = async () => {
    if (!values.title.trim()) return toast.error('Give the round a title');
    const row = {
      title: values.title.trim(),
      class_level: values.class_level.trim().toUpperCase(),
      fee_kobo: Math.round(Number(values.fee || 0) * 100),
      opens_at: values.opens_at ? new Date(values.opens_at).toISOString() : null,
      closes_at: values.closes_at ? new Date(values.closes_at).toISOString() : null,
      is_open: values.is_open,
      instructions: values.instructions.trim() || null,
    };
    const { error } = cycle ? await supabase.from('entrance_cycles').update(row).eq('id', cycle.id) : await supabase.from('entrance_cycles').insert(row);
    if (error) return toast.error(error.message);
    toast.success('Saved');
    queryClient.invalidateQueries({ queryKey: ['entrance_cycles'] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{cycle ? 'Edit admission round' : 'New admission round'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Title</Label><Input placeholder="JSS1 entrance, 2026/2027" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Class</Label><Input value={values.class_level} onChange={(e) => setValues({ ...values, class_level: e.target.value })} /></div>
            <div className="space-y-1"><Label>Application fee (₦)</Label><Input type="number" min={0} value={values.fee} onChange={(e) => setValues({ ...values, fee: e.target.value })} /></div>
            <div className="space-y-1"><Label>Applications open</Label><Input type="datetime-local" value={values.opens_at} onChange={(e) => setValues({ ...values, opens_at: e.target.value })} /></div>
            <div className="space-y-1"><Label>Applications close</Label><Input type="datetime-local" value={values.closes_at} onChange={(e) => setValues({ ...values, closes_at: e.target.value })} /></div>
          </div>
          <div className="space-y-1">
            <Label>Notes for applicants</Label>
            <Textarea rows={3} placeholder="Exam venue, what to bring, contact number" value={values.instructions} onChange={(e) => setValues({ ...values, instructions: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={values.is_open} onCheckedChange={(v) => setValues({ ...values, is_open: v })} />Accepting applications</label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Admissions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { data: settings } = useSchoolSettings();
  const cycles = useQuery({
    queryKey: ['entrance_cycles', 'all'],
    queryFn: async () => unwrap(await supabase.from('entrance_cycles').select('*').order('created_at', { ascending: false })) as EntranceCycle[],
  });
  const [cycleId, setCycleId] = useState('');
  const cycle = cycles.data?.find((c) => c.id === (cycleId || cycles.data?.[0]?.id));
  const exam = useExam(cycle?.exam_id ?? undefined);
  const applicants = useQuery({
    queryKey: ['applicants', cycle?.id],
    enabled: !!cycle,
    queryFn: async () => unwrap(await supabase.from('applicants').select('*').eq('cycle_id', cycle!.id).order('created_at')) as Applicant[],
  });
  const [status, setStatus] = useState<string>(ALL);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingCycle, setEditingCycle] = useState<EntranceCycle | null | 'new'>(null);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [letters, setLetters] = useState<Applicant[]>([]);
  const { printing, print } = usePrint();
  const [printKind, setPrintKind] = useState<'slips' | 'letters'>('slips');

  const ranked = useMemo(() => {
    const list = applicants.data ?? [];
    const scored = list.filter((a) => a.score !== null).sort((a, b) => Number(b.score) - Number(a.score));
    const rank = new Map(scored.map((a) => [a.id, scored.findIndex((x) => Number(x.score) === Number(a.score)) + 1]));
    return list.map((a) => ({ ...a, rank: rank.get(a.id) ?? null }));
  }, [applicants.data]);
  const visible = ranked.filter((a) => status === ALL || a.status === status);
  const chosen = ranked.filter((a) => selected.has(a.id));
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['applicants'] });

  const update = async (fields: Partial<Applicant>, ids: string[], message: string) => {
    const { error } = await supabase.from('applicants').update({ ...fields, updated_at: new Date().toISOString() }).in('id', ids);
    if (error) return toast.error(error.message);
    toast.success(message);
    setSelected(new Set());
    refresh();
  };

  const createExam = async () => {
    if (!cycle) return;
    const { data, error } = await supabase
      .from('exams')
      .insert({ title: `${cycle.title} examination`, kind: 'entrance', duration_minutes: 60, created_by: profile!.id, max_attempts: 1, show_score: false })
      .select('id')
      .single();
    if (error) return toast.error(error.message);
    await supabase.from('exam_sections').insert({ exam_id: data.id, title: 'Mathematics', sort_order: 0 });
    await supabase.from('entrance_cycles').update({ exam_id: data.id }).eq('id', cycle.id);
    queryClient.invalidateQueries({ queryKey: ['entrance_cycles'] });
    navigate(`/staff/exams/${data.id}`);
  };

  const schedule = async (resetPasswords = false) => {
    try {
      const { results } = await invokeFunction<{ results: ({ id: string; ok: boolean; application_no: string; name?: string; password?: string | null; error?: string })[] }>(
        'entrance-admin',
        { action: 'schedule', applicant_ids: [...selected], reset_passwords: resetPasswords },
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length) toast.error(`${failed.length} not scheduled: ${failed[0].application_no} — ${failed[0].error}`);
      const ok = results.filter((r) => r.ok) as Slip[];
      if (ok.length) toast.success(`${ok.length} scheduled. Login details queued by SMS.`);
      setSlips(ok);
      setSelected(new Set());
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const refreshScores = async () => {
    const { data, error } = await supabase.rpc('refresh_applicant_scores', { p_cycle_id: cycle!.id });
    if (error) return toast.error(error.message);
    toast.success(`Updated ${data} scores`);
    refresh();
  };

  const decide = (decision: 'admitted' | 'rejected') => {
    const note = window.prompt(`${decision === 'admitted' ? 'Admit' : 'Decline'} ${selected.size} applicants. Note to include (optional):`, '');
    if (note === null) return;
    update({ status: decision, decision_note: note || null }, [...selected], decision === 'admitted' ? 'Marked as admitted' : 'Marked as not admitted');
  };

  const columns: ColumnDef<(typeof ranked)[number], unknown>[] = [
    {
      id: 'select',
      enableSorting: false,
      header: () => (
        <input type="checkbox" aria-label="Select all" checked={visible.length > 0 && visible.every((a) => selected.has(a.id))}
          onChange={(e) => setSelected(e.target.checked ? new Set(visible.map((a) => a.id)) : new Set())} />
      ),
      cell: ({ row }) => (
        <input type="checkbox" aria-label="Select" checked={selected.has(row.original.id)}
          onChange={() => setSelected((s) => { const n = new Set(s); if (n.has(row.original.id)) n.delete(row.original.id); else n.add(row.original.id); return n; })} />
      ),
    },
    { accessorKey: 'application_no', header: 'Application no.' },
    { id: 'name', header: 'Name', accessorFn: (a) => `${a.last_name} ${a.first_name}`, cell: ({ row }) => <span className="font-medium">{row.original.last_name} {row.original.first_name}</span> },
    { accessorKey: 'guardian_phone', header: 'Parent phone' },
    { id: 'status', header: 'Status', accessorFn: (a) => a.status, cell: ({ row }) => <Badge variant={row.original.status === 'rejected' ? 'destructive' : 'secondary'}>{STATUS_LABELS[row.original.status]}</Badge> },
    { id: 'score', header: 'Score', accessorFn: (a) => Number(a.score ?? -1), cell: ({ row }) => (row.original.score !== null ? `${Number(row.original.score)} / ${Number(row.original.max_score)}` : '') },
    { id: 'rank', header: 'Rank', accessorFn: (a) => a.rank ?? 99999, cell: ({ row }) => row.original.rank ?? '' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admissions"
        description="Entrance applications, payment, exam scheduling, ranking and decisions."
        actions={<Button onClick={() => setEditingCycle('new')}><Plus className="mr-2 h-4 w-4" />New admission round</Button>}
      />
      {cycles.data?.length === 0 && <p className="text-sm text-muted-foreground">Create an admission round to start taking applications.</p>}
      {cycle && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={cycle.id} onValueChange={(v) => { setCycleId(v); setSelected(new Set()); }}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>{cycles.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => setEditingCycle(cycle)} aria-label="Edit round"><Pencil className="h-4 w-4" /></Button>
            {cycle.is_open ? <Badge className="bg-green-600 hover:bg-green-600">Accepting applications</Badge> : <Badge variant="outline">Closed</Badge>}
            <span className="text-sm text-muted-foreground">Fee {cycle.fee_kobo ? naira(cycle.fee_kobo) : 'free'}</span>
          </div>
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 pt-6 text-sm">
              {cycle.exam_id ? (
                <>
                  <span>Entrance exam: <b>{exam.data?.title}</b> ({exam.data?.status}{exam.data?.opens_at && `, opens ${formatDateTime(exam.data.opens_at)}`})</span>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/staff/exams/${cycle.exam_id}`)}>Open exam</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/staff/exams/${cycle.exam_id}/monitor`)}>Monitor</Button>
                  <Button size="sm" variant="outline" onClick={refreshScores}><RefreshCw className="mr-1 h-4 w-4" />Update scores</Button>
                </>
              ) : (
                <>
                  <span>No entrance exam yet.</span>
                  <Button size="sm" onClick={createExam}>Create entrance exam</Button>
                </>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All applicants ({ranked.length})</SelectItem>
                {(Object.keys(STATUS_LABELS) as ApplicantStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]} ({ranked.filter((a) => a.status === s).length})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/50 px-2 py-1">
                <span className="mr-1 text-sm">{selected.size} selected</span>
                <Button size="sm" variant="ghost" onClick={() => update({ status: 'paid', paid_at: new Date().toISOString() } as Partial<Applicant>, chosen.filter((a) => a.status === 'submitted').map((a) => a.id), 'Marked as paid at the office')}>
                  Mark paid
                </Button>
                <Button size="sm" variant="ghost" onClick={() => schedule(false)}>Schedule for exam</Button>
                <Button size="sm" variant="ghost" onClick={() => window.confirm('Issue new passwords to the selected candidates?') && schedule(true)}>New passwords</Button>
                <Button size="sm" variant="ghost" onClick={() => decide('admitted')}>Admit</Button>
                <Button size="sm" variant="ghost" onClick={() => decide('rejected')}>Decline</Button>
                <Button size="sm" variant="ghost" onClick={() => { setLetters(chosen.filter((a) => a.status === 'admitted')); setPrintKind('letters'); setTimeout(print, 50); }} disabled={!chosen.some((a) => a.status === 'admitted')}>
                  <Printer className="mr-1 h-4 w-4" />Admission letters
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              className="ml-auto"
              onClick={() =>
                downloadSpreadsheet(`${cycle.title} applicants.xlsx`, ranked.map((a) => ({
                  application_no: a.application_no, surname: a.last_name, first_name: a.first_name, other_name: a.other_name, gender: a.gender,
                  date_of_birth: a.date_of_birth, previous_school: a.previous_school, guardian: a.guardian_name, phone: a.guardian_phone,
                  email: a.guardian_email, status: STATUS_LABELS[a.status], paid: a.paid_at ? 'yes' : '', score: a.score, rank: a.rank,
                })))
              }
            >
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
          </div>
          <DataTable columns={columns} data={visible} isLoading={applicants.isLoading} error={applicants.error} searchPlaceholder="Search name, number or phone" emptyMessage="No applications yet." pageSize={50} />
        </>
      )}

      <CycleDialog cycle={editingCycle === 'new' ? null : editingCycle} open={editingCycle !== null} onClose={() => setEditingCycle(null)} />

      <Dialog open={slips.length > 0} onOpenChange={(o) => !o && setSlips([])}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Exam slips</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Passwords are shown once. Print the slips now; they have also been queued to parents by SMS.</p>
          <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
            {slips.map((s) => <li key={s.application_no} className="flex justify-between"><span>{s.name}</span><span className="font-mono">{s.application_no} · {s.password ?? 'unchanged'}</span></li>)}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlips([])}>Close</Button>
            <Button onClick={() => { setPrintKind('slips'); print(); }}><Printer className="mr-2 h-4 w-4" />Print slips</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {printing && printKind === 'slips' && (
        <PrintArea className="grid grid-cols-2 gap-3 p-2 text-sm">
          {slips.map((s) => (
            <div key={s.application_no} className="break-inside-avoid rounded border border-dashed border-black p-3">
              <div className="font-semibold">{settings?.school_name} — Entrance examination slip</div>
              <div className="mt-1">{s.name}</div>
              <div>Application no. (login): <b className="font-mono">{s.application_no}</b></div>
              {s.password && <div>Password: <b className="font-mono">{s.password}</b></div>}
              {exam.data?.opens_at && <div>Exam: {formatDateTime(exam.data.opens_at)}</div>}
              <div>Website: {window.location.origin}</div>
              {cycle?.instructions && <div className="mt-1 whitespace-pre-wrap text-xs">{cycle.instructions}</div>}
            </div>
          ))}
        </PrintArea>
      )}
      {printing && printKind === 'letters' && (
        <PrintArea>
          {letters.map((a, i) => (
            <div key={a.id} className={`mx-auto max-w-[180mm] p-8 text-[13px] leading-relaxed ${i < letters.length - 1 ? 'page-break' : ''}`}>
              <div className="mb-6 border-b-2 border-black pb-3 text-center">
                <img src={settings?.logo_url ?? '/brand/logo.png'} alt="" className="mx-auto mb-2 h-16" />
                <div className="text-lg font-bold uppercase">{settings?.school_name}</div>
                {settings?.address && <div>{settings.address}</div>}
              </div>
              <p>{new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mt-4">Dear {a.guardian_name},</p>
              <p className="mt-4 font-semibold uppercase">Offer of admission: {a.first_name} {a.other_name ?? ''} {a.last_name} ({a.application_no})</p>
              <p className="mt-4">
                We are pleased to offer {a.first_name} admission into {cycle?.class_level} following the entrance examination for {cycle?.title}.
                {a.decision_note && ` ${a.decision_note}`}
              </p>
              <p className="mt-4">Please contact the school office to complete registration.</p>
              <p className="mt-10">Yours faithfully,</p>
              <p className="mt-10">______________________<br />Principal</p>
            </div>
          ))}
        </PrintArea>
      )}
    </div>
  );
}
