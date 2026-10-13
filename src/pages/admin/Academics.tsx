import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { supabase } from '@/lib/supabase';
import { useClassSubjects, useClasses, useSchoolSettings, useSessions, useSubjects } from '@/hooks/useReferenceData';
import { useStaff } from '@/features/people/queries';
import { TERM_LABELS, fullName } from '@/types/db';

const NONE = '__none__';

function useMutate() {
  const queryClient = useQueryClient();
  return async (action: PromiseLike<{ error: { message: string } | null }>, success: string, keys: string[]) => {
    const { error } = await action;
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'That already exists.' : error.message);
      return false;
    }
    toast.success(success);
    keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
    return true;
  };
}

function SessionsTab() {
  const sessions = useSessions();
  const settings = useSchoolSettings();
  const mutate = useMutate();
  const [name, setName] = useState('');

  const createSession = async () => {
    if (!/^\d{4}\/\d{4}$/.test(name.trim())) {
      toast.error('Write the session as 2025/2026');
      return;
    }
    const { data, error } = await supabase.from('sessions').insert({ name: name.trim() }).select('id').single();
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'That session already exists.' : error.message);
      return;
    }
    // Every Nigerian school session has three terms
    await mutate(
      supabase.from('terms').insert([1, 2, 3].map((term) => ({ session_id: data.id, term }))),
      `Session ${name} created with three terms`,
      ['sessions'],
    );
    setName('');
  };

  const setCurrent = (termId: string) =>
    mutate(supabase.from('school_settings').update({ current_term_id: termId, updated_at: new Date().toISOString() }).eq('id', 1), 'Current term updated', ['school_settings']);

  const updateDates = (termId: string, field: 'starts_on' | 'ends_on', value: string) =>
    mutate(supabase.from('terms').update({ [field]: value || null }).eq('id', termId), 'Saved', ['sessions']);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New session</CardTitle>
          <CardDescription>Creates the session with its first, second and third terms.</CardDescription>
        </CardHeader>
        <CardContent className="flex max-w-sm gap-2">
          <Input placeholder="2025/2026" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={createSession}><Plus className="mr-2 h-4 w-4" />Create</Button>
        </CardContent>
      </Card>
      {sessions.data?.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <CardTitle className="text-base">{session.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.terms.map((term) => {
                  const isCurrent = settings.data?.current_term_id === term.id;
                  return (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">{TERM_LABELS[term.term]}</TableCell>
                      <TableCell>
                        <Input type="date" className="w-40" defaultValue={term.starts_on ?? ''} onBlur={(e) => e.target.value !== (term.starts_on ?? '') && updateDates(term.id, 'starts_on', e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input type="date" className="w-40" defaultValue={term.ends_on ?? ''} onBlur={(e) => e.target.value !== (term.ends_on ?? '') && updateDates(term.id, 'ends_on', e.target.value)} />
                      </TableCell>
                      <TableCell className="text-right">
                        {isCurrent ? (
                          <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />Current term</Badge>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setCurrent(term.id)}>Make current</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
      {sessions.data?.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet. Create the current session to start.</p>}
    </div>
  );
}

function ClassesTab() {
  const classes = useClasses();
  const staff = useStaff();
  const mutate = useMutate();
  const [form, setForm] = useState({ level: '', arm: '', stream: '' });
  const armRef = useRef<HTMLInputElement>(null);
  const teachers = staff.data?.filter((s) => s.is_active) ?? [];

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.level.trim()) {
      toast.error('Enter the class level, e.g. JSS1');
      return;
    }
    const ok = await mutate(
      supabase.from('classes').insert({
        level: form.level.trim().toUpperCase().replace(/\s+/g, ''),
        arm: form.arm.trim(),
        stream: form.stream || null,
        sort_order: (classes.data?.length ?? 0) * 10,
      }),
      'Class created',
      ['classes'],
    );
    // Keep the level so the next arm (JSS1 B, JSS1 C…) is one field away
    if (ok) setForm({ level: form.level, arm: '', stream: form.stream });
    armRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a class</CardTitle>
          <CardDescription>Level such as Primary5, JSS1 or SS2; arm such as A or Gold. Senior classes can carry a stream.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1"><Label htmlFor="class-level">Level</Label><Input id="class-level" className="w-32" placeholder="JSS1" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="class-arm">Arm</Label><Input id="class-arm" ref={armRef} className="w-32" placeholder="A" value={form.arm} onChange={(e) => setForm({ ...form, arm: e.target.value })} /></div>
          <div className="space-y-1">
            <Label>Stream</Label>
            <Select value={form.stream || NONE} onValueChange={(v) => setForm({ ...form, stream: v === NONE ? '' : v })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">Press Enter to add. The level stays filled in, so you can add arm B, C and so on straight after.</p>
        </CardContent>
      </Card>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Stream</TableHead>
              <TableHead>Class teacher</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.data?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="capitalize">{c.stream ?? '—'}</TableCell>
                <TableCell>
                  <Select
                    value={c.class_teacher_id ?? NONE}
                    onValueChange={(v) => mutate(supabase.from('classes').update({ class_teacher_id: v === NONE ? null : v }).eq('id', c.id), 'Class teacher set', ['classes'])}
                  >
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Not assigned</SelectItem>
                      {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{fullName(t)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${c.name}`}
                    onClick={() =>
                      window.confirm(`Delete ${c.name}? Students in it will have no class.`) &&
                      mutate(supabase.from('classes').delete().eq('id', c.id), 'Class deleted', ['classes', 'people'])
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {classes.data?.length === 0 && (
              <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No classes yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** "Mathematics, MTH" or "Mathematics" per line → rows to insert. */
function parseSubjectLines(text: string) {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, code] = line.split(/\s*[,\t]\s*/);
      return { name: name.trim(), code: code?.trim().toUpperCase() || null };
    })
    .filter((row) => row.name);
}

function SubjectsTab() {
  const subjects = useSubjects();
  const mutate = useMutate();
  const [form, setForm] = useState({ name: '', code: '' });
  const [bulk, setBulk] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const ok = await mutate(
      supabase.from('subjects').insert({ name: form.name.trim(), code: form.code.trim().toUpperCase() || null }),
      `${form.name.trim()} added`,
      ['subjects'],
    );
    if (ok) setForm({ name: '', code: '' });
    // Ready for the next subject straight away
    nameRef.current?.focus();
  };

  const createMany = async () => {
    const existing = new Set((subjects.data ?? []).map((s) => s.name.toLowerCase()));
    const rows = parseSubjectLines(bulk ?? '').filter((r) => !existing.has(r.name.toLowerCase()));
    if (!rows.length) {
      toast.error('Nothing new to add');
      return;
    }
    const ok = await mutate(supabase.from('subjects').insert(rows), `${rows.length} subjects added`, ['subjects']);
    if (ok) setBulk(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 pt-6">
          {bulk === null ? (
            <form onSubmit={create} className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="subject-name">Subject</Label>
                <Input id="subject-name" ref={nameRef} className="w-64" placeholder="Mathematics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="subject-code">Code</Label>
                <Input id="subject-code" className="w-28" placeholder="MTH" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <Button type="submit"><Plus className="mr-2 h-4 w-4" />Add</Button>
              <Button type="button" variant="ghost" onClick={() => setBulk('')}>Add several at once</Button>
            </form>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="subject-bulk">One subject per line; add a code after a comma if you like</Label>
              <Textarea
                id="subject-bulk"
                rows={8}
                autoFocus
                placeholder={'English Language, ENG\nMathematics, MTH\nBasic Science\nCivic Education, CVE'}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={createMany}><Plus className="mr-2 h-4 w-4" />Add {parseSubjectLines(bulk).length || ''} subjects</Button>
                <Button variant="ghost" onClick={() => setBulk(null)}>Cancel</Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Press Enter to add, then type the next one. Subjects already in the list are skipped.</p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        {subjects.data?.map((s) => (
          <Badge key={s.id} variant="secondary" className="gap-2 py-1 pl-3 pr-1 text-sm font-normal">
            {s.name}{s.code && <span className="text-muted-foreground">{s.code}</span>}
            <button
              className="rounded p-0.5 hover:bg-background"
              aria-label={`Delete ${s.name}`}
              onClick={() => window.confirm(`Delete ${s.name}?`) && mutate(supabase.from('subjects').delete().eq('id', s.id), 'Subject deleted', ['subjects', 'class_subjects'])}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

/** Grid of classes × subjects: tick to offer the subject, pick who teaches it. */
function AssignmentsTab() {
  const classes = useClasses();
  const subjects = useSubjects();
  const classSubjects = useClassSubjects();
  const staff = useStaff();
  const mutate = useMutate();
  const [classId, setClassId] = useState<string>('');
  const teachers = staff.data?.filter((s) => s.is_active) ?? [];
  const selectedClass = classId || classes.data?.[0]?.id || '';
  const offered = useMemo(
    () => new Map((classSubjects.data ?? []).filter((cs) => cs.class_id === selectedClass).map((cs) => [cs.subject_id, cs])),
    [classSubjects.data, selectedClass],
  );

  const copyToClass = async (targetId: string) => {
    const rows = [...offered.values()].map((cs) => ({ class_id: targetId, subject_id: cs.subject_id }));
    await mutate(supabase.from('class_subjects').upsert(rows, { onConflict: 'class_id,subject_id', ignoreDuplicates: true }), 'Subjects copied', ['class_subjects']);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={selectedClass} onValueChange={setClassId}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Choose class" /></SelectTrigger>
            <SelectContent>{classes.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {offered.size > 0 && (
          <Select onValueChange={copyToClass}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Copy these subjects to…" /></SelectTrigger>
            <SelectContent>
              {classes.data?.filter((c) => c.id !== selectedClass).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      {selectedClass && (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Offered</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.data?.map((subject) => {
                const link = offered.get(subject.id);
                return (
                  <TableRow key={subject.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={!!link}
                        aria-label={`Offer ${subject.name}`}
                        onChange={(e) =>
                          e.target.checked
                            ? mutate(supabase.from('class_subjects').insert({ class_id: selectedClass, subject_id: subject.id }), `${subject.name} added`, ['class_subjects'])
                            : link && mutate(supabase.from('class_subjects').delete().eq('id', link.id), `${subject.name} removed`, ['class_subjects'])
                        }
                      />
                    </TableCell>
                    <TableCell className={link ? 'font-medium' : 'text-muted-foreground'}>{subject.name}</TableCell>
                    <TableCell>
                      {link && (
                        <Select
                          value={link.teacher_id ?? NONE}
                          onValueChange={(v) => mutate(supabase.from('class_subjects').update({ teacher_id: v === NONE ? null : v }).eq('id', link.id), 'Teacher assigned', ['class_subjects'])}
                        >
                          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Not assigned</SelectItem>
                            {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{fullName(t)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Teachers can set exams and enter scores only for the classes and subjects assigned to them here.</p>
    </div>
  );
}

export default function Academics() {
  return (
    <div className="space-y-6">
      <PageHeader title="Classes and subjects" description="Sessions and terms, classes, subjects and who teaches what." />
      <Tabs defaultValue="sessions">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sessions">Sessions and terms</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="assignments">Teaching assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="mt-4"><SessionsTab /></TabsContent>
        <TabsContent value="classes" className="mt-4"><ClassesTab /></TabsContent>
        <TabsContent value="subjects" className="mt-4"><SubjectsTab /></TabsContent>
        <TabsContent value="assignments" className="mt-4"><AssignmentsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
