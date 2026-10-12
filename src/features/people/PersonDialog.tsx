import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useClasses } from '@/hooks/useReferenceData';
import { normalisePhone } from '@/lib/login-id';
import { parseDate } from './parseImport';
import type { NewUser } from './api';

export type PersonKind = 'student' | 'staff';

const optionalPhone = z
  .string()
  .trim()
  .refine((v) => !v || normalisePhone(v), 'Enter a Nigerian mobile number, e.g. 0803 123 4567');

const studentSchema = z
  .object({
    first_name: z.string().trim().min(1, 'Required'),
    last_name: z.string().trim().min(1, 'Required'),
    other_name: z.string().trim(),
    admission_no: z.string().trim().min(1, 'Required'),
    class_id: z.string(),
    gender: z.enum(['', 'male', 'female']),
    date_of_birth: z.string().trim().refine((v) => !v || parseDate(v), 'Use 2013-04-21 or 21/04/2013'),
    guardian_first_name: z.string().trim(),
    guardian_last_name: z.string().trim(),
    guardian_phone: optionalPhone,
    guardian_email: z.union([z.literal(''), z.string().trim().email('Not a valid email')]),
    guardian_relationship: z.string().trim(),
  })
  .refine((v) => !v.guardian_phone || (v.guardian_first_name && v.guardian_last_name), {
    path: ['guardian_first_name'],
    message: 'Guardian name is needed with a phone number',
  });

const staffSchema = z.object({
  first_name: z.string().trim().min(1, 'Required'),
  last_name: z.string().trim().min(1, 'Required'),
  email: z.string().trim().email('Enter a valid email'),
  phone: optionalPhone,
  role: z.enum(['teacher', 'exam_officer', 'admin']),
});

type StudentForm = z.infer<typeof studentSchema>;
type StaffForm = z.infer<typeof staffSchema>;

interface PersonDialogProps {
  kind: PersonKind | null;
  onClose: () => void;
  onSubmit: (user: NewUser) => Promise<void>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function StudentFields({ onSubmit, onClose }: Omit<PersonDialogProps, 'kind'>) {
  const { data: classes } = useClasses();
  const form = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      first_name: '', last_name: '', other_name: '', admission_no: '', class_id: '', gender: '', date_of_birth: '',
      guardian_first_name: '', guardian_last_name: '', guardian_phone: '', guardian_email: '', guardian_relationship: '',
    },
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (v) => {
    await onSubmit({
      role: 'student',
      first_name: v.first_name,
      last_name: v.last_name,
      other_name: v.other_name || undefined,
      student: {
        admission_no: v.admission_no,
        class_id: v.class_id || null,
        gender: v.gender || null,
        date_of_birth: v.date_of_birth ? parseDate(v.date_of_birth) : null,
      },
      guardian: v.guardian_phone
        ? {
            first_name: v.guardian_first_name,
            last_name: v.guardian_last_name,
            phone: v.guardian_phone,
            email: v.guardian_email || undefined,
            relationship: v.guardian_relationship || undefined,
          }
        : undefined,
    });
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="First name" error={errors.first_name?.message}><Input {...form.register('first_name')} /></Field>
        <Field label="Other name"><Input {...form.register('other_name')} /></Field>
        <Field label="Last name" error={errors.last_name?.message}><Input {...form.register('last_name')} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Admission number" error={errors.admission_no?.message}>
          <Input placeholder="KK/2025/001" {...form.register('admission_no')} />
        </Field>
        <Field label="Class">
          <Select value={form.watch('class_id')} onValueChange={(v) => form.setValue('class_id', v)}>
            <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
            <SelectContent>
              {classes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Gender">
          <Select value={form.watch('gender')} onValueChange={(v) => form.setValue('gender', v as StudentForm['gender'])}>
            <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date of birth" error={errors.date_of_birth?.message}>
          <Input type="date" {...form.register('date_of_birth')} />
        </Field>
      </div>
      <Separator />
      <p className="text-sm font-medium">Parent or guardian (optional)</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" error={errors.guardian_first_name?.message}><Input {...form.register('guardian_first_name')} /></Field>
        <Field label="Last name"><Input {...form.register('guardian_last_name')} /></Field>
        <Field label="Phone (used to sign in)" error={errors.guardian_phone?.message}><Input inputMode="tel" {...form.register('guardian_phone')} /></Field>
        <Field label="Email" error={errors.guardian_email?.message}><Input type="email" {...form.register('guardian_email')} /></Field>
        <Field label="Relationship"><Input placeholder="Mother" {...form.register('guardian_relationship')} /></Field>
      </div>
      <p className="text-xs text-muted-foreground">If the phone number already has a parent account, the student is linked to it.</p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create student'}</Button>
      </DialogFooter>
    </form>
  );
}

function StaffFields({ onSubmit, onClose }: Omit<PersonDialogProps, 'kind'>) {
  const form = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '', role: 'teacher' },
  });
  const { errors, isSubmitting } = form.formState;
  const submit = form.handleSubmit(async (v) => {
    await onSubmit({ role: v.role, first_name: v.first_name, last_name: v.last_name, email: v.email, phone: v.phone || undefined });
  });

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" error={errors.first_name?.message}><Input {...form.register('first_name')} /></Field>
        <Field label="Last name" error={errors.last_name?.message}><Input {...form.register('last_name')} /></Field>
        <Field label="Email (used to sign in)" error={errors.email?.message}><Input type="email" {...form.register('email')} /></Field>
        <Field label="Phone" error={errors.phone?.message}><Input inputMode="tel" {...form.register('phone')} /></Field>
        <Field label="Role">
          <Select value={form.watch('role')} onValueChange={(v) => form.setValue('role', v as StaffForm['role'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="exam_officer">Exam officer</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create account'}</Button>
      </DialogFooter>
    </form>
  );
}

export function PersonDialog({ kind, onClose, onSubmit }: PersonDialogProps) {
  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{kind === 'student' ? 'Add student' : 'Add staff member'}</DialogTitle>
        </DialogHeader>
        {/* Dialog content unmounts on close, so each opening starts with an empty form */}
        {kind === 'student' && <StudentFields onSubmit={onSubmit} onClose={onClose} />}
        {kind === 'staff' && <StaffFields onSubmit={onSubmit} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
