import {useEffect, useRef} from 'react';
import {toast} from 'sonner';
import {Toaster} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {AppShell} from '@/components/app/shell';
import {VoiceSettingsSheet} from '@/components/voice-settings';
import {PwaUpdates} from '@/components/pwa';
import {ThemeProvider} from '@/hooks/use-theme';
import {AudioProvider, useAudio} from '@/hooks/use-audio';
import {PracticeProvider, usePractice} from '@/hooks/use-practice';
import {cameBack, goBack, navigate, openedFrom, savedScroll, useRoute} from '@/hooks/use-route';
import {parentOf, titleOf} from '@/components/app/nav';
import {useIsDesktop} from '@/hooks/use-media-query';
import {initCloud} from '@/core/cloud.js';
import {OefenenScreen} from '@/screens/oefenen';
import {ThemesScreen} from '@/screens/themes';
import {PracticeLayer} from '@/screens/practice';
import {GrammarScreen} from '@/screens/grammar';
import {RouteScreen} from '@/screens/route';
import {MeScreen, SettingsScreen} from '@/screens/me';
import {ResourcesScreen} from '@/screens/resources';
import {hideSplash} from '@/lib/native';
import {GameLayer, GamesScreen} from '@/screens/games';
import {WelcomeScreen, useWelcome} from '@/screens/welcome';
import {SignInSheet} from '@/components/app/sign-in';

function Screens() {
  const route = useRoute();
  const {session, game, playGame} = usePractice();
  const audio = useAudio();
  const first = useRef(true);
  const layer = session ? <PracticeLayer session={session} /> : game ? <GameLayer open={game} /> : null;

  // Old links to a game (?spel=) open it over the Spellen tab.
  useEffect(() => {
    if (!route.game) return;
    const theme = route.theme ?? 'all';
    navigate('spellen', {replace: true});
    playGame(route.game, theme);
  }, [route.game, route.theme, playGame]);

  // iOS: swiping from the left edge goes back, like the back button. Never during a round or game.
  useEffect(() => {
    const onBack = () => {
      if (layer) return;
      const parent = parentOf(route);
      if (parent || openedFrom()) goBack(parent);
    };
    window.addEventListener('native-back', onBack);
    return () => window.removeEventListener('native-back', onBack);
  }, [layer, route]);

  // On every screen change: stop audio, update the title, and go to the top, or back to where you were
  // when you came back to this screen. Focus moves to the heading for screen readers.
  const key = `${route.panel}:${route.theme ?? ''}:${route.rule ?? ''}:${route.step ?? ''}`;
  useEffect(() => {
    audio.cancel();
    document.title = `${titleOf(route)} — Nedfa`;
    if (first.current) {
      first.current = false;
      return;
    }
    const top = cameBack ? savedScroll() : 0;
    requestAnimationFrame(() => {
      window.scrollTo({top, behavior: 'instant'});
      const heading = document.querySelector<HTMLElement>('main h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({preventScroll: true});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <AppShell route={route} layer={layer}>
      {route.panel === 'oefenen' && <OefenenScreen />}
      {route.panel === 'woorden' && <ThemesScreen themeId={route.theme} topic={route.topic} />}
      {route.panel === 'zinnen' && <GrammarScreen rule={route.rule} />}
      {route.panel === 'route' && <RouteScreen step={route.step} />}
      {route.panel === 'spellen' && <GamesScreen />}
      {route.panel === 'voortgang' && <MeScreen />}
      {route.panel === 'instellingen' && <SettingsScreen />}
      {route.panel === 'bronnen' && <ResourcesScreen section={route.section} />}
    </AppShell>
  );
}

export function App() {
  const desktop = useIsDesktop();
  const welcome = useWelcome();
  // The iOS splash screen stays until the first screen is drawn.
  useEffect(() => { requestAnimationFrame(() => void hideSplash()); }, []);
  useEffect(() => {
    const onMessage = (event: Event) => toast((event as CustomEvent<string>).detail);
    const onStorage = () => toast.error('Je browser kan je voortgang niet bewaren.');
    window.addEventListener('auth-message', onMessage);
    window.addEventListener('learning-storage-error', onStorage);
    void initCloud();
    return () => {
      window.removeEventListener('auth-message', onMessage);
      window.removeEventListener('learning-storage-error', onStorage);
    };
  }, []);
  return (
    <ThemeProvider>
      <TooltipProvider delayDuration={300}>
        <AudioProvider>
          <PracticeProvider>
            <a href="#main" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Naar de inhoud</a>
            {welcome.show ? <WelcomeScreen onDone={welcome.finish} /> : <Screens />}
            <SignInSheet />
            <VoiceSettingsSheet />
            <PwaUpdates />
            <Toaster position={desktop ? 'bottom-right' : 'top-center'} mobileOffset={{top: 'calc(env(safe-area-inset-top) + 12px)'}} />
          </PracticeProvider>
        </AudioProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
