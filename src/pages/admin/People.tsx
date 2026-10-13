import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { FileUp, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { ImportWizard, type ParsedRow } from '@/components/ImportWizard';
import { useAuth } from '@/auth/AuthProvider';
import { useClasses } from '@/hooks/useReferenceData';
import { ROLE_LABELS, fullName, type AppRole, type Profile } from '@/types/db';
import { supabase } from '@/lib/supabase';
import { bulkCreateUsers, changeRole, createUser, resetPassword, setActive, type Credential, type NewUser } from '@/features/people/api';
import { useParents, useStaff, useStudents, type ParentRow, type StudentRow } from '@/features/people/queries';
import { PersonDialog, type PersonKind } from '@/features/people/PersonDialog';
import { CredentialsDialog } from '@/features/people/CredentialsDialog';
import { EditStudentDialog } from '@/features/people/EditStudentDialog';
import { GuardianDialog } from '@/features/people/GuardianDialog';
import { DeleteAccountDialog } from '@/features/people/DeleteAccountDialog';
import { STAFF_TEMPLATE, STUDENT_TEMPLATE, parseStaffRows, parseStudentRows } from '@/features/people/parseImport';

const IMPORT_CHUNK = 25;

function StatusBadge({ active }: { active: boolean }) {
  return active ? <Badge variant="secondary">Active</Badge> : <Badge variant="destructive">Deactivated</Badge>;
}

export default function People() {
  const queryClient = useQueryClient();
  const { profile: me } = useAuth();
  const students = useStudents();
  const staff = useStaff();
  const parents = useParents();
  const { data: classes } = useClasses();

  const [tab, setTab] = useState('students');
  const [adding, setAdding] = useState<PersonKind | null>(null);
  const [importing, setImporting] = useState<PersonKind | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [addingGuardianFor, setAddingGuardianFor] = useState<StudentRow | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['people'] });

  const handleCreate = async (user: NewUser) => {
    try {
      const result = await createUser(user);
      setAdding(null);
      setCredentials([result.account, ...(result.guardian ? [result.guardian] : [])]);
      toast.success(`${result.account.name} added`);
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleReset = async (userId: string) => {
    try {
      setCredentials([await resetPassword(userId)]);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleActive = async (person: Profile, active: boolean) => {
    if (!active && !window.confirm(`Deactivate ${fullName(person)}? They will be signed out and unable to sign in.`)) return;
    try {
      await setActive(person.id, active);
      toast.success(active ? 'Account reactivated' : 'Account deactivated');
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Right of access under the Nigeria Data Protection Act: everything held about one person
  const handleExport = async (person: Profile) => {
    const { data, error } = await supabase.rpc('export_person_data', { p_user_id: person.id });
    if (error || !data) return toast.error(error?.message ?? 'Nothing to export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `personal-data-${(person.login_id ?? person.id).replace(/[^a-z0-9]+/gi, '-')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    await supabase.rpc('log_action', { p_action: 'account.export_data', p_entity: 'profiles', p_entity_id: person.id, p_details: null });
  };

  const handleRole = async (person: Profile, role: AppRole) => {
    try {
      await changeRole(person.id, role);
      toast.success(`${fullName(person)} is now ${ROLE_LABELS[role].toLowerCase()}`);
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const runImport = async (rows: ParsedRow<NewUser>[], onProgress: (f: number) => void) => {
    const created: Credential[] = [];
    const failed: { line: number; error: string }[] = [];
    for (let start = 0; start < rows.length; start += IMPORT_CHUNK) {
      const chunk = rows.slice(start, start + IMPORT_CHUNK);
      try {
        const { results } = await bulkCreateUsers(chunk.map((r) => r.value!));
        for (const result of results) {
          if (result.ok) {
            created.push(result.account);
            if (result.guardian) created.push(result.guardian);
          } else {
            failed.push({ line: chunk[result.index].line, error: result.error });
          }
        }
      } catch (error) {
        chunk.forEach((r) => failed.push({ line: r.line, error: (error as Error).message }));
      }
      onProgress(Math.min(1, (start + chunk.length) / rows.length));
    }
    refresh();
    // De-duplicate parents shared by siblings in the same file
    const unique = [...new Map(created.map((c) => [c.user_id, c])).values()];
    if (unique.length) setCredentials(unique);
    return { imported: rows.length - failed.length, failed };
  };

  const existingAdmissionNos = useMemo(() => new Set((students.data ?? []).map((s) => s.admission_no.toLowerCase())), [students.data]);
  const existingEmails = useMemo(() => new Set((staff.data ?? []).map((s) => (s.email ?? '').toLowerCase())), [staff.data]);

  const studentColumns: ColumnDef<StudentRow, unknown>[] = [
    { id: 'name', header: 'Name', accessorFn: (s) => fullName(s.profile), cell: ({ row }) => <span className="font-medium">{fullName(row.original.profile)}</span> },
    { accessorKey: 'admission_no', header: 'Admission no.' },
    { id: 'class', header: 'Class', accessorFn: (s) => s.class?.name ?? '' },
    {
      id: 'guardians',
      header: 'Parents',
      accessorFn: (s) => s.guardians.map((g) => fullName(g.guardian)).join(', '),
      cell: ({ getValue }) => (getValue() as string) || <span className="text-muted-foreground">None</span>,
    },
    { id: 'status', header: 'Status', accessorFn: (s) => (s.profile.is_active ? 'active' : 'deactivated'), cell: ({ row }) => <StatusBadge active={row.original.profile.is_active} /> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(row.original)}>Edit details</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAddingGuardianFor(row.original)}>Add parent</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleReset(row.original.id)}>Reset password</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleExport(row.original.profile)}>Download personal data</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleActive(row.original.profile, !row.original.profile.is_active)}>
              {row.original.profile.is_active ? 'Deactivate' : 'Reactivate'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting(row.original.profile)}>
              Delete permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const staffColumns: ColumnDef<Profile, unknown>[] = [
    { id: 'name', header: 'Name', accessorFn: (p) => fullName(p), cell: ({ row }) => <span className="font-medium">{fullName(row.original)}</span> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { id: 'role', header: 'Role', accessorFn: (p) => ROLE_LABELS[p.role] },
    { id: 'status', header: 'Status', accessorFn: (p) => (p.is_active ? 'active' : 'deactivated'), cell: ({ row }) => <StatusBadge active={row.original.is_active} /> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.id === me?.id ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Change role</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {(['teacher', 'exam_officer', 'admin'] as AppRole[]).map((role) => (
                    <DropdownMenuItem key={role} disabled={row.original.role === role} onSelect={() => handleRole(row.original, role)}>
                      {ROLE_LABELS[role]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={() => handleReset(row.original.id)}>Reset password</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleExport(row.original)}>Download personal data</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleActive(row.original, !row.original.is_active)}>
                {row.original.is_active ? 'Deactivate' : 'Reactivate'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting(row.original)}>
                Delete permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ];

  const parentColumns: ColumnDef<ParentRow, unknown>[] = [
    { id: 'name', header: 'Name', accessorFn: (p) => fullName(p), cell: ({ row }) => <span className="font-medium">{fullName(row.original)}</span> },
    { accessorKey: 'login_id', header: 'Phone (login)' },
    { accessorKey: 'email', header: 'Email' },
    { id: 'children', header: 'Children', accessorFn: (p) => p.children.map((c) => `${fullName(c.student.profile)} (${c.student.admission_no})`).join(', ') },
    { id: 'status', header: 'Status', accessorFn: (p) => (p.is_active ? 'active' : 'deactivated'), cell: ({ row }) => <StatusBadge active={row.original.is_active} /> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => handleReset(row.original.id)}>Reset password</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleExport(row.original)}>Download personal data</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleActive(row.original, !row.original.is_active)}>
              {row.original.is_active ? 'Deactivate' : 'Reactivate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting(row.original)}>
              Delete permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="People" description="Student, staff and parent accounts. Parents are created from a student's guardian details." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="students">Students {students.data && <span className="ml-1 text-muted-foreground">{students.data.length}</span>}</TabsTrigger>
          <TabsTrigger value="staff">Staff {staff.data && <span className="ml-1 text-muted-foreground">{staff.data.length}</span>}</TabsTrigger>
          <TabsTrigger value="parents">Parents {parents.data && <span className="ml-1 text-muted-foreground">{parents.data.length}</span>}</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <DataTable
            columns={studentColumns}
            data={students.data}
            isLoading={students.isLoading}
            error={students.error}
            searchPlaceholder="Search name, admission no. or class"
            emptyMessage="No students yet. Add one, or import a class list from Excel."
            toolbar={
              <>
                <Button variant="outline" onClick={() => setImporting('student')}><FileUp className="mr-2 h-4 w-4" />Import</Button>
                <Button onClick={() => setAdding('student')}><Plus className="mr-2 h-4 w-4" />Add student</Button>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="staff" className="mt-4">
          <DataTable
            columns={staffColumns}
            data={staff.data}
            isLoading={staff.isLoading}
            error={staff.error}
            searchPlaceholder="Search name or email"
            toolbar={
              <>
                <Button variant="outline" onClick={() => setImporting('staff')}><FileUp className="mr-2 h-4 w-4" />Import</Button>
                <Button onClick={() => setAdding('staff')}><Plus className="mr-2 h-4 w-4" />Add staff</Button>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="parents" className="mt-4">
          <DataTable
            columns={parentColumns}
            data={parents.data}
            isLoading={parents.isLoading}
            error={parents.error}
            searchPlaceholder="Search name, phone or child"
            emptyMessage="Parents appear here when you add them to a student."
          />
        </TabsContent>
      </Tabs>

      <PersonDialog kind={adding} onClose={() => setAdding(null)} onSubmit={handleCreate} />

      <Dialog open={importing !== null} onOpenChange={(open) => !open && setImporting(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{importing === 'student' ? 'Import students' : 'Import staff'}</DialogTitle>
          </DialogHeader>
          {importing === 'student' && (
            <ImportWizard<NewUser>
              instructions={
                <>
                  One row per student. Required: admission_no, first_name, last_name. The class must match a class
                  name exactly as set up (for example JSS1 A). A guardian phone creates or links a parent account.
                </>
              }
              templateFileName="students-template.xlsx"
              templateRows={STUDENT_TEMPLATE}
              parse={(rows) => parseStudentRows(rows, classes ?? [], existingAdmissionNos)}
              previewColumns={[
                { header: 'Admission no.', cell: (r) => r.raw.admission_no },
                { header: 'Name', cell: (r) => `${r.raw.first_name ?? ''} ${r.raw.last_name ?? ''}` },
                { header: 'Class', cell: (r) => r.raw.class },
                { header: 'Guardian phone', cell: (r) => r.raw.guardian_phone },
              ]}
              onImport={runImport}
              onDone={() => setImporting(null)}
            />
          )}
          {importing === 'staff' && (
            <ImportWizard<NewUser>
              instructions={<>One row per staff member: first_name, last_name, email, phone, role (teacher, exam_officer or admin).</>}
              templateFileName="staff-template.xlsx"
              templateRows={STAFF_TEMPLATE}
              parse={(rows) => parseStaffRows(rows, existingEmails)}
              previewColumns={[
                { header: 'Name', cell: (r) => `${r.raw.first_name ?? ''} ${r.raw.last_name ?? ''}` },
                { header: 'Email', cell: (r) => r.raw.email },
                { header: 'Role', cell: (r) => r.raw.role || 'teacher' },
              ]}
              onImport={runImport}
              onDone={() => setImporting(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <EditStudentDialog student={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      <GuardianDialog
        student={addingGuardianFor}
        onClose={() => setAddingGuardianFor(null)}
        onLinked={(credential) => {
          setAddingGuardianFor(null);
          refresh();
          if (credential?.password) setCredentials([credential]);
        }}
      />
      <CredentialsDialog credentials={credentials} onClose={() => setCredentials([])} />
      <DeleteAccountDialog
        person={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          refresh();
        }}
      />
    </div>
  );
}
