import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileUp, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/auth/AuthProvider';
import { useClassSubjects, useClasses, useSchoolSettings, useSessions, useSubjects } from '@/hooks/useReferenceData';
import { supabase, unwrap } from '@/lib/supabase';
import { downloadSpreadsheet, readSpreadsheet } from '@/lib/spreadsheet';
import { TERM_LABELS, type Profile } from '@/types/db';
import { useGradeScale, useReleases, useTermScores } from '@/features/results/queries';
import { gradeFor } from '@/features/results/grades';

interface Row {
  student_id: string;
  name: string;
  admission_no: string;
  ca: string;
  exam: string;
}

const toNumber = (value: string) => (value.trim() === '' ? null : Number(value));

export default function Scores() {
  const queryClient = useQueryClient();
  const { profile, can } = useAuth();
  const { data: settings } = useSchoolSettings();
  const { data: sessions } = useSessions();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const { data: classSubjects } = useClassSubjects();
  const { data: scale = [] } = useGradeScale();

  const terms = useMemo(() => sessions?.flatMap((s) => s.terms.map((t) => ({ ...t, label: `${s.name} · ${TERM_LABELS[t.term]}` }))) ?? [], [sessions]);
  const [termId, setTermId] = useState('');
  const [assignment, setAssignment] = useState('');
  useEffect(() => {
    if (!termId && settings?.current_term_id) setTermId(settings.current_term_id);
  }, [termId, settings]);

  const allowed = (classSubjects ?? []).filter((cs) => can('scores.all') || cs.teacher_id === profile?.id);
  const [classId, subjectId] = assignment.split(':');
  const releases = useReleases(termId);
  const released = !!releases.data?.some((r) => r.class_id === classId);
  const locked = released && !can('results.release');

  const students = useQuery({
    queryKey: ['class_students', classId],
    enabled: !!classId,
    queryFn: async () =>
      unwrap(
        await supabase.from('students').select('id, admission_no, profile:profiles!students_id_fkey(first_name, last_name, other_name, is_active)').eq('class_id', classId),
      ) as unknown as { id: string; admission_no: string; profile: Profile }[],
  });
  const scores = useTermScores(termId, classId, subjectId);

  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  useEffect(() => {
    const byStudent = new Map((scores.data ?? []).map((s) => [s.student_id, s]));
    setRows(
      (students.data ?? [])
        .filter((s) => s.profile.is_active)
        .map((s) => ({
          student_id: s.id,
          name: `${s.profile.last_name} ${s.profile.first_name}`,
          admission_no: s.admission_no,
          ca: byStudent.get(s.id)?.ca_score?.toString() ?? '',
          exam: byStudent.get(s.id)?.exam_score?.toString() ?? '',
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    setDirty(new Set());
  }, [students.data, scores.data]);

  const caMax = settings?.ca_weight ?? 40;
  const examMax = settings?.exam_weight ?? 60;
  const invalid = (value: string, max: number) => value.trim() !== '' && !(Number(value) >= 0 && Number(value) <= max);
  const hasErrors = rows.some((r) => invalid(r.ca, caMax) || invalid(r.exam, examMax));

  const edit = (studentId: string, field: 'ca' | 'exam', value: string) => {
    setRows((rs) => rs.map((r) => (r.student_id === studentId ? { ...r, [field]: value } : r)));
    setDirty((d) => new Set(d).add(studentId));
  };

  const save = async () => {
    const changed = rows.filter((r) => dirty.has(r.student_id));
    if (!changed.length) return;
    const { error } = await supabase.from('term_scores').upsert(
      changed.map((r) => ({ student_id: r.student_id, term_id: termId, subject_id: subjectId, class_id: classId, ca_score: toNumber(r.ca), exam_score: toNumber(r.exam) })),
      { onConflict: 'student_id,term_id,subject_id' },
    );
    if (error) return toast.error(error.message);
    toast.success(`Saved ${changed.length} students`);
    queryClient.invalidateQueries({ queryKey: ['term_scores'] });
  };

  const pull = async () => {
    if (dirty.size && !window.confirm('You have unsaved changes. Pulling CBT scores reloads the sheet. Continue?')) return;
    const { data, error } = await supabase.rpc('pull_cbt_scores', { p_term_id: termId, p_class_id: classId, p_subject_id: subjectId });
    if (error) return toast.error(error.message);
    toast.success(
      data ? `Filled scores for ${data} students from CBT exams in this term` : 'No CBT exams in this term are marked "counts towards CA" or "counts as the term exam".',
    );
    queryClient.invalidateQueries({ queryKey: ['term_scores'] });
  };

  const importFile = async (file: File) => {
    const sheet = await readSpreadsheet(file);
    const byAdmission = new Map(rows.map((r) => [r.admission_no.toLowerCase(), r.student_id]));
    let matched = 0;
    const missing: string[] = [];
    for (const line of sheet) {
      const id = byAdmission.get((line.admission_no ?? '').toLowerCase());
      if (!id) {
        if (line.admission_no) missing.push(line.admission_no);
        continue;
      }
      if (line.ca !== undefined && line.ca !== '') edit(id, 'ca', line.ca);
      if (line.exam !== undefined && line.exam !== '') edit(id, 'exam', line.exam);
      matched++;
    }
    toast.success(`Filled ${matched} students. Check and save.`);
    if (missing.length) toast.warning(`Not in this class: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`);
  };

  const subjectName = subjects?.find((s) => s.id === subjectId)?.name ?? '';
  const className = classes?.find((c) => c.id === classId)?.name ?? '';

  return (
    <div className="space-y-6">
      <PageHeader title="Scores" description={`Continuous assessment out of ${caMax} and exam out of ${examMax}, combined into the term total.`} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Term</Label>
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Choose term" /></SelectTrigger>
            <SelectContent>{terms.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Class and subject</Label>
          <Select value={assignment} onValueChange={setAssignment}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Choose" /></SelectTrigger>
            <SelectContent>
              {allowed.map((cs) => (
                <SelectItem key={cs.id} value={`${cs.class_id}:${cs.subject_id}`}>
                  {classes?.find((c) => c.id === cs.class_id)?.name} · {subjects?.find((s) => s.id === cs.subject_id)?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {allowed.length === 0 && <p className="text-sm text-muted-foreground">No class subjects are assigned to you.</p>}

      {termId && classId && (
        <>
          {released && (
            <Alert>
              <AlertDescription>
                {locked ? 'Results for this class have been released, so the scores are locked. Ask an administrator to reopen them.' : 'Results for this class have been released. Changes show on report cards straight away.'}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={pull} disabled={locked}><RefreshCw className="mr-2 h-4 w-4" />Fill from CBT exams</Button>
            <Button
              variant="outline"
              onClick={() =>
                downloadSpreadsheet(
                  `${className} ${subjectName} scores.xlsx`,
                  rows.map((r) => ({ admission_no: r.admission_no, name: r.name, ca: r.ca, exam: r.exam })),
                )
              }
            >
              <Download className="mr-2 h-4 w-4" />Download sheet
            </Button>
            <Button variant="outline" asChild disabled={locked}>
              <label className="cursor-pointer">
                <FileUp className="mr-2 h-4 w-4" />Upload sheet
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} disabled={locked} />
              </label>
            </Button>
            <Button onClick={save} disabled={!dirty.size || hasErrors || locked}>
              <Save className="mr-2 h-4 w-4" />Save {dirty.size > 0 && `(${dirty.size})`}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission no.</TableHead>
                  <TableHead className="w-28">CA /{caMax}</TableHead>
                  <TableHead className="w-28">Exam /{examMax}</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const empty = r.ca.trim() === '' && r.exam.trim() === '';
                  const total = (Number(r.ca) || 0) + (Number(r.exam) || 0);
                  return (
                    <TableRow key={r.student_id} className={dirty.has(r.student_id) ? 'bg-amber-50' : undefined}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.admission_no}</TableCell>
                      <TableCell>
                        <Input
                          type="number" min={0} max={caMax} step={0.5} className={`h-8 ${invalid(r.ca, caMax) ? 'border-destructive' : ''}`}
                          value={r.ca} onChange={(e) => edit(r.student_id, 'ca', e.target.value)} disabled={locked} aria-label={`CA for ${r.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number" min={0} max={examMax} step={0.5} className={`h-8 ${invalid(r.exam, examMax) ? 'border-destructive' : ''}`}
                          value={r.exam} onChange={(e) => edit(r.student_id, 'exam', e.target.value)} disabled={locked} aria-label={`Exam for ${r.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{empty ? '' : total}</TableCell>
                      <TableCell>{empty ? '' : gradeFor(total, scale)?.grade}</TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No students in this class.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {hasErrors && <p className="text-sm text-destructive">Some scores are above the maximum. Fix them before saving.</p>}
        </>
      )}
    </div>
  );
}
