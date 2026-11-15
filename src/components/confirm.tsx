import {useState, type ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';

/** Asks before every big step (signing out, unlinking, deleting): the trigger opens a dialog with Annuleren and the action. */
export function Confirm({title, description, action, destructive = false, onConfirm, children}: {
  title: string; description: string; action: string; destructive?: boolean; onConfirm: () => Promise<unknown> | void; children: (open: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); setOpen(false); }
  };
  return (
    <>
      {children(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Annuleren</Button></DialogClose>
            <Button variant={destructive ? 'destructive' : 'default'} disabled={busy} onClick={() => void confirm()}>{busy ? 'Bezig…' : action}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

