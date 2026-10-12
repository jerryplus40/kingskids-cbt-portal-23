import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { normalisePhone } from '@/lib/login-id';
import { fullName } from '@/types/db';
import { linkGuardian, type Credential } from './api';
import type { StudentRow } from './queries';

/** Adds a parent to a student: links an existing parent account by phone, or creates one. */
export function GuardianDialog({
  student,
  onClose,
  onLinked,
}: {
  student: StudentRow | null;
  onClose: () => void;
  onLinked: (credential: Credential | null) => void;
}) {
  const [values, setValues] = useState({ first_name: '', last_name: '', phone: '', email: '', relationship: '' });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const save = async () => {
    if (!student) return;
    if (!normalisePhone(values.phone)) {
      toast.error('Enter a Nigerian mobile number, e.g. 0803 123 4567');
      return;
    }
    if (!values.first_name.trim() || !values.last_name.trim()) {
      toast.error('Enter the parent’s first and last name');
      return;
    }
    setSaving(true);
    try {
      const { guardian } = await linkGuardian(student.id, {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        phone: values.phone,
        email: values.email.trim() || undefined,
        relationship: values.relationship.trim() || undefined,
      });
      toast.success(guardian?.password ? 'Parent account created and linked' : 'Linked to the existing parent account');
      setValues({ first_name: '', last_name: '', phone: '', email: '', relationship: '' });
      onLinked(guardian);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add parent or guardian</DialogTitle>
          {student && <DialogDescription>For {fullName(student.profile)} ({student.admission_no})</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>First name</Label><Input value={values.first_name} onChange={set('first_name')} /></div>
          <div className="space-y-1"><Label>Last name</Label><Input value={values.last_name} onChange={set('last_name')} /></div>
          <div className="space-y-1"><Label>Phone (used to sign in)</Label><Input inputMode="tel" value={values.phone} onChange={set('phone')} /></div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" value={values.email} onChange={set('email')} /></div>
          <div className="space-y-1"><Label>Relationship</Label><Input placeholder="Father" value={values.relationship} onChange={set('relationship')} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
