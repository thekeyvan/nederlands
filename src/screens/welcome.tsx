import {useEffect, useState} from 'react';
import {MascotActor} from '@/components/game/mascot-actor';
import {SignInButtons, SignInReasons, useCanSignIn} from '@/components/app/sign-in';
import {Button} from '@/components/ui/button';
import {useCloud} from '@/hooks/use-cloud';

const KEY = 'nederlands-welcome-done';
const read = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return true;
  }
};
const remember = () => {
  try {
    localStorage.setItem(KEY, '1');
  } catch { /* Shown again next time; harmless. */ }
};

/** First start: sign in so progress follows you between the app and the website, or try it first. */
export function useWelcome() {
  const cloud = useCloud();
  const [done, setDone] = useState(read);
  useEffect(() => {
    if (cloud.user && !done) {
      remember();
      setDone(true);
    }
  }, [cloud.user, done]);
  const finish = () => {
    remember();
    setDone(true);
  };
  return {show: !done && !cloud.user, finish};
}

export function WelcomeScreen({onDone}: {onDone: () => void}) {
  const cloud = useCloud();
  const canSignIn = useCanSignIn();
  const checking = cloud.status === 'starting';
  return (
    <main id="main" className="flex min-h-dvh flex-col bg-background" style={{paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)'}}>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-8 pb-6">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <MascotActor pose="wave" moment="greet" delay={300} className="size-40 sm:size-48" label="De mascotte zwaait" />
          <p className="mt-6 text-xs font-semibold tracking-wider text-primary uppercase">Nedfa · Nederlands van nul tot B1</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Elke dag een beetje Nederlands.</h1>
          <p className="mt-3 text-muted-foreground">Thema’s met audio, spellen en slim herhalen. Een paar minuten per dag is genoeg.</p>
        </div>
        <div className="mt-8 flex flex-col gap-5">
          {canSignIn && (
            <>
              <SignInReasons className="rounded-xl border bg-card p-4" />
              {checking ? <p className="py-4 text-center text-sm text-muted-foreground" role="status">Even kijken of je al bent ingelogd…</p> : <SignInButtons />}
            </>
          )}
          <Button variant={canSignIn ? 'ghost' : 'default'} size={canSignIn ? 'lg' : 'xl'} game={!canSignIn} className="w-full" onClick={onDone}>
            {canSignIn ? 'Eerst proberen zonder account' : 'Begin'}
          </Button>
          {canSignIn && <p className="-mt-3 text-center text-xs text-muted-foreground">Je kunt later altijd nog inloggen. Je voortgang gaat dan mee.</p>}
        </div>
      </div>
    </main>
  );
}
