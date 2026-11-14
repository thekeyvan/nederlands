import {useEffect, useRef} from 'react';
import {toast} from 'sonner';
import {Toaster} from '@/components/ui/sonner';
import {TooltipProvider} from '@/components/ui/tooltip';
import {AppShell} from '@/components/app/shell';
import {VoiceSettingsSheet} from '@/components/voice-settings';
import {ThemeProvider} from '@/hooks/use-theme';
import {AudioProvider, useAudio} from '@/hooks/use-audio';
import {PracticeProvider, usePractice} from '@/hooks/use-practice';
import {panelTitles, useRoute} from '@/hooks/use-route';
import {useIsDesktop} from '@/hooks/use-media-query';
import {initCloud} from '@/core/cloud.js';
import {TodayScreen} from '@/screens/today';
import {ThemesScreen} from '@/screens/themes';
import {PracticeScreen} from '@/screens/practice';
import {GrammarScreen} from '@/screens/grammar';
import {RouteScreen} from '@/screens/route';
import {MeScreen} from '@/screens/me';
import {ResourcesScreen} from '@/screens/resources';

function Screens() {
  const route = useRoute();
  const {session} = usePractice();
  const audio = useAudio();
  const first = useRef(true);
  const focus = route.panel === 'oefenen' && session !== null;

  // On every navigation: stop audio, update the title, return to the top and move focus to the heading.
  const key = `${route.panel}:${route.theme ?? ''}:${route.rule ?? ''}:${route.step ?? ''}`;
  useEffect(() => {
    audio.cancel();
    document.title = `${panelTitles[route.panel]} — Mijn Nederlands`;
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({top: 0, behavior: 'instant'});
    requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({preventScroll: true});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <AppShell panel={route.panel} focus={focus}>
      {route.panel === 'vandaag' && <TodayScreen />}
      {route.panel === 'woorden' && <ThemesScreen themeId={route.theme} topic={route.topic} />}
      {route.panel === 'oefenen' && <PracticeScreen />}
      {route.panel === 'zinnen' && <GrammarScreen rule={route.rule} />}
      {route.panel === 'route' && <RouteScreen step={route.step} />}
      {route.panel === 'voortgang' && <MeScreen />}
      {route.panel === 'bronnen' && <ResourcesScreen section={route.section} />}
    </AppShell>
  );
}

export function App() {
  const desktop = useIsDesktop();
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
            <Screens />
            <VoiceSettingsSheet />
            <Toaster position={desktop ? 'bottom-right' : 'top-center'} />
          </PracticeProvider>
        </AudioProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
