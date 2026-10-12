import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useClasses } from '@/hooks/useReferenceData';
import { supabase } from '@/lib/supabase';
import type { StudentRow } from './queries';

export function EditStudentDialog({ student, onClose, onSaved }: { student: StudentRow | null; onClose: () => void; onSaved: () => void }) {
  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit student</DialogTitle>
        </DialogHeader>
        {student && <EditStudentForm student={student} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function EditStudentForm({ student, onClose, onSaved }: { student: StudentRow; onClose: () => void; onSaved: () => void }) {
  const { data: classes } = useClasses();
  const [values, setValues] = useState({
    first_name: student.profile.first_name,
    other_name: student.profile.other_name ?? '',
    last_name: student.profile.last_name,
    class_id: student.class_id ?? '',
    gender: student.gender ?? '',
    date_of_birth: student.date_of_birth ?? '',
    extra_time_percent: String(student.profile.extra_time_percent ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const save = async () => {
    if (!values.first_name.trim() || !values.last_name.trim()) {
      toast.error('First and last name are required');
      return;
    }
    setSaving(true);
    const profileUpdate = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name.trim(),
        other_name: values.other_name.trim() || null,
        last_name: values.last_name.trim(),
        extra_time_percent: Math.min(100, Math.max(0, Number(values.extra_time_percent) || 0)),
      })
      .eq('id', student.id);
    const studentUpdate = await supabase
      .from('students')
      .update({ class_id: values.class_id || null, gender: values.gender || null, date_of_birth: values.date_of_birth || null })
      .eq('id', student.id);
    setSaving(false);
    const error = profileUpdate.error ?? studentUpdate.error;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Student updated');
    onSaved();
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1"><Label>First name</Label><Input value={values.first_name} onChange={set('first_name')} /></div>
        <div className="space-y-1"><Label>Other name</Label><Input value={values.other_name} onChange={set('other_name')} /></div>
        <div className="space-y-1"><Label>Last name</Label><Input value={values.last_name} onChange={set('last_name')} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Class</Label>
          <Select value={values.class_id} onValueChange={(v) => setValues((s) => ({ ...s, class_id: v }))}>
            <SelectTrigger><SelectValue placeholder="No class" /></SelectTrigger>
            <SelectContent>{classes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Gender</Label>
          <Select value={values.gender} onValueChange={(v) => setValues((s) => ({ ...s, gender: v }))}>
            <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1"><Label>Date of birth</Label><Input type="date" value={values.date_of_birth} onChange={set('date_of_birth')} /></div>
      </div>
      <div className="space-y-1">
        <Label>Extra exam time (%)</Label>
        <Input type="number" min={0} max={100} className="w-28" value={values.extra_time_percent} onChange={set('extra_time_percent')} />
        <p className="text-xs text-muted-foreground">For a documented need, e.g. 25 gives 50 minutes for a 40-minute paper.</p>
      </div>
      <p className="text-xs text-muted-foreground">Admission number {student.admission_no} is the student's login and cannot be changed here.</p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogFooter>
    </div>
  );
}
