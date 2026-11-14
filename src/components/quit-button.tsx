import {useState} from 'react';
import {X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';

/** The ✕ in practice rounds and games. Asks first once you have started, so a stray tap never ends a round. */
export function QuitButton({onQuit, label, title, description, confirm = true}: {onQuit: () => void; label: string; title: string; description: string; confirm?: boolean}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" aria-label={label} onClick={() => (confirm ? setOpen(true) : onQuit())}><X className="size-5" /></Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild><Button size="lg" game>Doorgaan</Button></DialogClose>
            <Button size="lg" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { setOpen(false); onQuit(); }}>Stoppen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
