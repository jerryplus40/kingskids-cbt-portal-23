import { Download, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadSpreadsheet } from '@/lib/spreadsheet';
import { usePrint } from '@/hooks/usePrint';
import { PrintArea } from '@/components/PrintArea';
import { useSchoolSettings } from '@/hooks/useReferenceData';
import { ROLE_LABELS } from '@/types/db';
import type { Credential } from './api';

const LOGIN_HINT: Record<string, string> = {
  student: 'Sign in with your admission number',
  parent: 'Sign in with your phone number',
};

/** Shows new temporary passwords once, with printable slips; they cannot be retrieved later. */
export function CredentialsDialog({ credentials, onClose }: { credentials: Credential[]; onClose: () => void }) {
  const { printing, print } = usePrint();
  const { data: settings } = useSchoolSettings();
  const withPasswords = credentials.filter((c) => c.password);
  const portal = window.location.origin;

  return (
    <Dialog open={credentials.length > 0} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Login details</DialogTitle>
          <DialogDescription>
            Print or download these now. Temporary passwords are not stored and cannot be shown again; each person must
            choose a new password at first sign-in.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Temporary password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credentials.map((c) => (
                <TableRow key={c.user_id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{ROLE_LABELS[c.role]}</TableCell>
                  <TableCell className="font-mono text-sm">{c.login_id}</TableCell>
                  <TableCell className="font-mono text-sm">{c.password ?? <span className="text-muted-foreground">existing account</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() =>
              downloadSpreadsheet(
                `login-details-${new Date().toISOString().slice(0, 10)}.xlsx`,
                withPasswords.map((c) => ({ name: c.name, role: ROLE_LABELS[c.role], login: c.login_id, temporary_password: c.password })),
              )
            }
          >
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button variant="outline" onClick={print} disabled={withPasswords.length === 0}>
            <Printer className="mr-2 h-4 w-4" /> Print slips
          </Button>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
        {printing && (
          <PrintArea className="grid grid-cols-2 gap-3 p-2">
            {withPasswords.map((c) => (
              <div key={c.user_id} className="break-inside-avoid rounded border border-dashed border-black p-3 text-sm">
                <div className="font-semibold">{settings?.school_name ?? "King's Kids"} — CBT Portal</div>
                <div className="mt-1">{c.name} ({ROLE_LABELS[c.role]})</div>
                <div className="mt-2">Website: {portal}</div>
                <div>{LOGIN_HINT[c.role] ?? 'Sign in with your email'}: <b className="font-mono">{c.login_id}</b></div>
                <div>Temporary password: <b className="font-mono">{c.password}</b></div>
                <div className="mt-1 text-xs">You will be asked to choose your own password.</div>
              </div>
            ))}
          </PrintArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
