import { useState } from 'react';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { fullName, type Profile } from '@/types/db';
import { deleteAccount } from './api';

const WHAT_GOES: Record<string, string> = {
  student: 'their student record, every exam attempt and answer, term scores, report comments and links to parents',
  parent: 'their sign-in and links to their children (the children’s accounts stay)',
  teacher: 'their sign-in; questions and exams they wrote stay, with no author shown',
  exam_officer: 'their sign-in; questions and exams they wrote stay, with no author shown',
  admin: 'their sign-in; everything they set up stays',
};

/** Permanent deletion, confirmed by typing the person's login. */
export function DeleteAccountDialog({ person, onClose, onDeleted }: { person: Profile | null; onClose: () => void; onDeleted: () => void }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const confirmWord = person?.login_id ?? '';
  const matches = typed.trim().toLowerCase() === confirmWord.toLowerCase();

  const close = () => {
    setTyped('');
    onClose();
  };

  const remove = async () => {
    if (!person) return;
    setDeleting(true);
    try {
      await deleteAccount(person.id);
      toast.success(`${fullName(person)} has been deleted`);
      setTyped('');
      onDeleted();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!person} onOpenChange={(open) => !open && close()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {person && fullName(person)} permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes {person ? WHAT_GOES[person.role] ?? 'their sign-in' : ''}. It cannot be undone. To keep their records but stop them signing in,
            deactivate the account instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1">
          <Label htmlFor="confirm-delete">Type <span className="font-mono font-semibold">{confirmWord}</span> to confirm</Label>
          <Input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={close}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!matches || deleting} onClick={remove}>
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
