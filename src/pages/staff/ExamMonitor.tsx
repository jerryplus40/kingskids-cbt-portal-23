import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, MoreHorizontal, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { PageHeader } from '@/components/PageHeader';
import { supabase, unwrap } from '@/lib/supabase';
import { useExam, useMonitor } from '@/features/exams/queries';
import type { MonitorRow } from '@/features/exams/types';

const OFFLINE_AFTER_MS = 90_000;
const EVENT_LABELS: Record<string, string> = {
  start: 'Started',
  resume: 'Resumed (refresh or new computer)',
  blur: 'Left the exam window',
  fullscreen_exit: 'Left full screen',
  copy: 'Tried to copy',
  paste: 'Tried to paste',
  offline: 'Lost connection',
  time_added: 'Time added',
  submit: 'Submitted',
};

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

const minutesLeft = (deadline: string | null, now: number) => {
  if (!deadline) return '';
  const s = Math.max(0, Math.round((Date.parse(deadline) - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function EventsSheet({ row, onClose }: { row: MonitorRow | null; onClose: () => void }) {
  const events = useQuery({
    queryKey: ['attempt_events', row?.attempt_id],
    enabled: !!row?.attempt_id,
    queryFn: async () =>
      unwrap(await supabase.from('attempt_events').select('*').eq('attempt_id', row!.attempt_id!).order('created_at')) as {
        id: number;
        kind: string;
        details: Record<string, unknown> | null;
        created_at: string;
      }[],
  });
  return (
    <Sheet open={!!row} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{row?.name}</SheetTitle>
        </SheetHeader>
        <ol className="mt-4 space-y-2 text-sm">
          {events.data?.map((ev) => (
            <li key={ev.id} className="flex justify-between gap-2 border-b pb-1">
              <span>{EVENT_LABELS[ev.kind] ?? ev.kind}{ev.kind === 'time_added' && ev.details ? ` (+${String(ev.details.minutes)} min)` : ''}</span>
              <span className="text-muted-foreground">{new Date(ev.created_at).toLocaleTimeString('en-NG')}</span>
            </li>
          ))}
          {events.data?.length === 0 && <li className="text-muted-foreground">No events.</li>}
        </ol>
      </SheetContent>
    </Sheet>
  );
}

export default function ExamMonitor() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const exam = useExam(id);
  const monitor = useMonitor(id);
  const now = useNow();
  const [viewing, setViewing] = useState<MonitorRow | null>(null);
  const rows = monitor.data ?? [];

  const act = async (action: PromiseLike<{ error: { message: string } | null }>, success: string) => {
    const { error } = await action;
    if (error) toast.error(error.message);
    else toast.success(success);
    queryClient.invalidateQueries({ queryKey: ['monitor', id] });
  };

  const addTime = (row: MonitorRow) => {
    const minutes = Number(window.prompt(`Minutes to add for ${row.name}`, '5'));
    if (minutes > 0) act(supabase.rpc('add_time', { p_attempt_id: row.attempt_id, p_minutes: minutes }), `${minutes} minutes added`);
  };
  const forceSubmit = (row: MonitorRow) =>
    window.confirm(`Submit ${row.name}'s exam now? Their saved answers will be graded.`) &&
    act(supabase.rpc('force_submit', { p_attempt_id: row.attempt_id }), 'Submitted');
  const reset = (row: MonitorRow) => {
    const reason = window.prompt(`Reset ${row.name}'s attempt? Their answers will be deleted and they can start again.\n\nReason (recorded):`);
    if (reason?.trim()) act(supabase.rpc('reset_attempt', { p_attempt_id: row.attempt_id, p_reason: reason.trim() }), 'Attempt reset');
  };

  const stats = {
    notStarted: rows.filter((r) => r.status === 'not_started').length,
    writing: rows.filter((r) => r.status === 'in_progress').length,
    submitted: rows.filter((r) => r.status === 'submitted').length,
    offline: rows.filter((r) => r.status === 'in_progress' && r.last_seen_at && now - Date.parse(r.last_seen_at) > OFFLINE_AFTER_MS).length,
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/staff/exams/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Exam</Link>
      </Button>
      <PageHeader title={`Monitor: ${exam.data?.title ?? ''}`} description="Updates every 10 seconds." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Not started', stats.notStarted],
          ['Writing', stats.writing],
          ['Submitted', stats.submitted],
          ['Not responding', stats.offline],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold">{value}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-48">Progress</TableHead>
              <TableHead>Time left</TableHead>
              <TableHead>Warnings</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const offline = row.status === 'in_progress' && row.last_seen_at && now - Date.parse(row.last_seen_at) > OFFLINE_AFTER_MS;
              return (
                <TableRow key={row.candidate_id} className="cursor-pointer" onClick={() => row.attempt_id && setViewing(row)}>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.login_id}</div>
                  </TableCell>
                  <TableCell>
                    {row.status === 'not_started' && <Badge variant="outline">Not started</Badge>}
                    {row.status === 'in_progress' && !offline && <Badge className="bg-green-600 hover:bg-green-600">Writing</Badge>}
                    {offline && <Badge variant="destructive" className="gap-1"><WifiOff className="h-3 w-3" />Not responding</Badge>}
                    {row.status === 'submitted' && <Badge variant="secondary">Submitted</Badge>}
                  </TableCell>
                  <TableCell>
                    {row.attempt_id && (
                      <div className="space-y-1">
                        <Progress value={row.total ? (row.answered / row.total) * 100 : 0} />
                        <span className="text-xs text-muted-foreground">{row.answered} of {row.total} answered</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{row.status === 'in_progress' ? minutesLeft(row.deadline_at, now) : ''}</TableCell>
                  <TableCell>
                    {row.warnings > 0 && (
                      <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="h-4 w-4" />{row.warnings}</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    {row.attempt_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setViewing(row)}>View activity</DropdownMenuItem>
                          {row.status === 'in_progress' && <DropdownMenuItem onSelect={() => addTime(row)}>Add time</DropdownMenuItem>}
                          {row.status === 'in_progress' && <DropdownMenuItem onSelect={() => forceSubmit(row)}>Submit now</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => reset(row)}>Reset attempt</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!monitor.isLoading && rows.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No candidates. Check that students are in this class.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        A candidate whose computer fails can sign in on another computer and continue; their answers and remaining time are kept.
        Use reset only when an attempt must start over.
      </p>
      <EventsSheet row={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
