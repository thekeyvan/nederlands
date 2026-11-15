import {useSyncExternalStore} from 'react';
import {Cloud, Laptop, LogIn, Smartphone} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Mascot} from '@/components/game/mascot';
import {ResponsiveSheet} from '@/components/responsive-sheet';
import {Avatar} from '@/components/app/account-chip';
import {cn} from '@/lib/utils';
import {useCloud} from '@/hooks/use-cloud';
import {navigate} from '@/hooks/use-route';
import {appleAvailable, signIn} from '@/core/cloud.js';

/* One sign-in sheet for the whole app, opened from the top bar, the sidebar and the Ik screen. */
let open = false;
const listeners = new Set<() => void>();
const setOpen = (value: boolean) => {
  open = value;
  listeners.forEach((listener) => listener());
};
export const openSignIn = () => setOpen(true);
const useSignInOpen = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, () => open, () => open);

/** True when this deployment has accounts (the Railway database) and they are reachable. */
export function useCanSignIn() {
  const cloud = useCloud();
  return !['local-only', 'unavailable'].includes(cloud.status);
}

export const AppleLogo = ({className}: {className?: string}) => (
  <svg viewBox="0 0 24 24" aria-hidden className={cn('size-5 fill-current', className)}><path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.97-3.46-1.07-1.57-2.74-1.78-3.33-1.8-1.42-.15-2.77.83-3.49.83-.72 0-1.83-.81-3.01-.79-1.55.02-2.98.9-3.78 2.29-1.61 2.8-.41 6.94 1.16 9.21.77 1.11 1.68 2.36 2.88 2.31 1.16-.05 1.59-.75 2.99-.75 1.39 0 1.79.75 3.01.72 1.24-.02 2.03-1.13 2.79-2.25.88-1.29 1.24-2.54 1.26-2.6-.03-.01-2.42-.93-2.45-3.71ZM14.08 5.84c.64-.77 1.07-1.85.95-2.92-.92.04-2.03.61-2.69 1.38-.59.68-1.11 1.78-.97 2.83 1.03.08 2.07-.52 2.71-1.29Z" /></svg>
);

export const GoogleLogo = ({className}: {className?: string}) => (
  // 17px: the G fills its box (22 of 24) while Apple's logo fills 18 of 24, so this makes them look the same size.
  <svg viewBox="0 0 24 24" aria-hidden className={cn('size-[17px]', className)}>
    <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09Z" />
    <path fill="#34A853" d="M12 23c2.95 0 5.43-.98 7.24-2.64l-3.54-2.75c-.98.66-2.23 1.05-3.7 1.05-2.85 0-5.26-1.92-6.12-4.5H2.22v2.84A10.99 10.99 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.88 14.16a6.6 6.6 0 0 1 0-4.32V7H2.22a11 11 0 0 0 0 9.99l3.66-2.83Z" />
    <path fill="#EA4335" d="M12 5.38c1.61 0 3.06.55 4.2 1.64l3.14-3.14A10.5 10.5 0 0 0 12 1 10.99 10.99 0 0 0 2.22 7l3.66 2.84C6.74 7.3 9.15 5.38 12 5.38Z" />
  </svg>
);

/** Apple (when available) and Google, full width, in the order Apple asks for on iOS. */
export function SignInButtons({className}: {className?: string}) {
  const close = () => setOpen(false);
  return (
    <div className={cn('flex w-full flex-col gap-2.5', className)}>
      {appleAvailable() && (
        <Button size="xl" className="w-full bg-foreground text-background hover:bg-foreground/90" onClick={() => { close(); void signIn('apple'); }}>
          <AppleLogo />Doorgaan met Apple
        </Button>
      )}
      <Button size="xl" variant="outline" className="w-full bg-card" onClick={() => { close(); void signIn('google'); }}>
        <GoogleLogo />Doorgaan met Google
      </Button>
    </div>
  );
}

/** Why an account helps: the same progress on the phone and on the website. */
export function SignInReasons({className}: {className?: string}) {
  const reasons = [
    {icon: Smartphone, text: 'Op je telefoon in de app'},
    {icon: Laptop, text: 'Op je laptop op de website'},
    {icon: Cloud, text: 'Je reeks, XP en planning gaan mee'},
  ];
  return (
    <ul className={cn('flex flex-col gap-2 text-sm', className)}>
      {reasons.map(({icon: Icon, text}) => (
        <li key={text} className="flex items-center gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-info-soft text-info-foreground"><Icon className="size-4" aria-hidden /></span>{text}</li>
      ))}
    </ul>
  );
}

export function SignInSheet() {
  const isOpen = useSignInOpen();
  return (
    <ResponsiveSheet open={isOpen} onOpenChange={setOpen} title="Log in en ga overal verder" description="Eén account voor de app en de website.">
      <div className="flex flex-col gap-5 pb-4">
        <SignInReasons />
        <SignInButtons />
        <p className="text-center text-xs text-muted-foreground">
          Apple en Google met hetzelfde e-mailadres komen in hetzelfde account; bij Instellingen koppel je ze ook zelf. Je kunt je account altijd verwijderen.
        </p>
      </div>
    </ResponsiveSheet>
  );
}

/** Top-bar account button: "Inloggen" for guests, your initials when signed in. */
export function AccountButton() {
  const cloud = useCloud();
  const canSignIn = useCanSignIn();
  if (cloud.user) {
    return (
      <button type="button" onClick={() => navigate('voortgang')} aria-label={`Je account: ${cloud.user.name || 'Ik'}`} className="rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
        <Avatar name={cloud.user.name} />
      </button>
    );
  }
  if (!canSignIn || cloud.status === 'starting') return null;
  return <Button size="sm" className="h-8 px-3" onClick={openSignIn}><LogIn />Inloggen</Button>;
}

/** A short reminder on Oefenen for learners without an account. */
export function SignInNudge({className}: {className?: string}) {
  const cloud = useCloud();
  const canSignIn = useCanSignIn();
  if (cloud.user || !canSignIn || cloud.status === 'starting') return null;
  return (
    <div className={cn('flex items-center gap-3 rounded-xl border border-info/30 bg-info-soft p-3 text-info-foreground', className)}>
      <Mascot mood="think" className="size-10" />
      <p className="min-w-0 flex-1 text-sm font-medium">Log in en ga ook op de website verder.</p>
      <Button size="sm" variant="info" className="shrink-0" onClick={openSignIn}>Inloggen</Button>
    </div>
  );
}
