import {LogIn} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import {useCloud} from '@/hooks/use-cloud';
import {navigate} from '@/hooks/use-route';
import {signIn} from '@/core/cloud.js';

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'Ik';

export function Avatar({name, className}: {name: string; className?: string}) {
  return <span className={cn('grid size-8 shrink-0 place-items-center rounded-full bg-info text-xs font-bold text-info-foreground', className)} aria-hidden>{initials(name)}</span>;
}

/** Sidebar account row: sign in, or who you are and whether progress is saved. */
export function AccountChip() {
  const cloud = useCloud();
  if (cloud.status === 'local-only' || cloud.status === 'unavailable' || cloud.status === 'starting') return null;
  if (!cloud.user) {
    return (
      <Button variant="outline" className="w-full justify-start" onClick={() => void signIn()}>
        <LogIn />Inloggen met Google
      </Button>
    );
  }
  return (
    <button type="button" onClick={() => navigate('voortgang')} className="flex w-full items-center gap-3 rounded-lg border bg-card p-2.5 text-left hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
      <Avatar name={cloud.user.name} />
      <span className="min-w-0 text-xs">
        <span className="block truncate font-semibold">{cloud.user.name || 'Mijn account'}</span>
        <span className="text-muted-foreground">{cloud.status === 'syncing' ? 'Opslaan…' : cloud.status === 'saved' ? 'Opgeslagen' : 'Op dit apparaat'}</span>
      </span>
    </button>
  );
}
