import {useCallback, useEffect, useState} from 'react';
import {useRegisterSW} from 'virtual:pwa-register/react';
import {toast} from 'sonner';
import {CloudDownload, Download, MonitorSmartphone, Share, Smartphone, Trash2, WifiOff} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {useAudio} from '@/hooks/use-audio';
import {AUDIO_CACHE, persistStorage, useInstall} from '@/lib/pwa';
import {audioCatalog} from '@/core/audio-catalog.js';
import {audioUrl} from '@/core/audio-playback.js';

/** Service worker registration: offers new versions instead of reloading in the middle of a round. */
export function PwaUpdates() {
  const {needRefresh: [needRefresh], offlineReady: [offlineReady], updateServiceWorker} = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000);
    },
  });
  useEffect(() => {
    if (needRefresh) toast('Er is een nieuwe versie van de app.', {id: 'sw-update', duration: Infinity, action: {label: 'Vernieuwen', onClick: () => void updateServiceWorker(true)}});
  }, [needRefresh, updateServiceWorker]);
  useEffect(() => {
    if (offlineReady) toast.success('De app werkt nu ook zonder internet.', {id: 'sw-offline'});
  }, [offlineReady]);
  useEffect(() => {
    const offline = () => toast('Je bent offline. Oefenen en spellen werken gewoon; je voortgang wordt later opgeslagen.', {id: 'net', icon: <WifiOff className="size-4" />});
    const online = () => toast.dismiss('net');
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
    };
  }, []);
  return null;
}

/** "Installeer de app" for sidebars and menus; hidden when the browser cannot install. */
export function InstallButton({className, variant = 'outline'}: {className?: string; variant?: 'outline' | 'ghost'}) {
  const app = useInstall();
  if (!app.canInstall || app.standalone) return null;
  return <Button variant={variant} className={className} onClick={() => void app.install()}><Download />Installeer de app</Button>;
}

const clipUrls = (voice: string) => [...new Set(Object.keys(audioCatalog.clips).map((text) => audioUrl(text, voice)!).filter(Boolean))].map((url) => new URL(url, location.href).href);

function useOfflineAudio(voice: string) {
  const supported = typeof window !== 'undefined' && 'caches' in window && 'serviceWorker' in navigator;
  const [cached, setCached] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const total = supported ? clipUrls(voice).length : 0;
  const count = useCallback(async () => {
    if (!supported) return;
    const keys = await (await caches.open(AUDIO_CACHE)).keys();
    setCached(keys.filter((request) => request.url.includes(`/assets/audio/${voice}/`)).length);
  }, [supported, voice]);
  useEffect(() => { void count(); }, [count]);
  const download = async () => {
    if (!navigator.serviceWorker.controller) {
      toast('Laad de pagina één keer opnieuw en probeer het dan nog eens.');
      return;
    }
    await persistStorage();
    setBusy(true);
    setDone(0);
    const urls = clipUrls(voice);
    let failed = 0;
    let next = 0;
    // Plain fetches pass through the service worker, which keeps every clip.
    const worker = async () => {
      while (next < urls.length) {
        const url = urls[next++];
        try {
          const response = await fetch(url);
          if (!response.ok) failed++;
        } catch {
          failed++;
        }
        setDone((value) => value + 1);
      }
    };
    await Promise.all(Array.from({length: 6}, worker));
    setBusy(false);
    await count();
    if (failed) toast.error(`${failed} geluiden konden niet worden geladen. Probeer het later nog eens.`);
    else toast.success('Alle audio staat nu op dit apparaat.');
  };
  const remove = async () => {
    const cache = await caches.open(AUDIO_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.filter((request) => request.url.includes(`/assets/audio/${voice}/`)).map((request) => cache.delete(request)));
    await count();
  };
  return {supported, cached: Math.min(cached, total), total, busy, done, download, remove};
}

/** The "De app" card on Ik: install, offline status and offline audio. */
export function AppCard() {
  const app = useInstall();
  const audio = useAudio();
  const offline = useOfflineAudio(audio.voice);
  const complete = offline.total > 0 && offline.cached >= offline.total;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MonitorSmartphone className="size-5" />De app</CardTitle>
        <CardDescription>Zet Mijn Nederlands op je telefoon of computer. De app opent zonder internet; je voortgang wordt later opgeslagen.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {app.standalone || app.installed ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success-foreground"><Smartphone className="size-4" />Je gebruikt de app.</p>
        ) : app.canInstall ? (
          <Button game className="self-start" onClick={() => void app.install()}><Download />Installeer de app</Button>
        ) : app.ios ? (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Op je iPhone of iPad:</p>
            <p className="mt-1 text-muted-foreground">Open deze site in Safari, tik op <Share className="inline size-4 align-text-bottom" aria-label="Delen" /> <strong>Delen</strong> en kies <strong>Zet op beginscherm</strong>.</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Gebruik in Chrome of Edge het installatie-icoon in de adresbalk, of kies in het menu <strong>App installeren</strong>.</p>
        )}
        {offline.supported && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Offline luisteren</p>
                <p className="text-xs text-muted-foreground">Alle audio van {audio.voiceName} (± 25 MB). Wat je al hebt gehoord, staat er al op.</p>
              </div>
              {complete ? (
                <Button variant="ghost" size="sm" onClick={() => void offline.remove()}><Trash2 />Verwijder</Button>
              ) : (
                <Button variant="outline" size="sm" disabled={offline.busy} onClick={() => void offline.download()}><CloudDownload />{offline.busy ? 'Bezig…' : 'Download'}</Button>
              )}
            </div>
            <Progress value={offline.total ? ((offline.busy ? offline.done : offline.cached) / offline.total) * 100 : 0} className="h-2" indicatorClassName={complete ? 'bg-success' : undefined} aria-label="Audio op dit apparaat" />
            <p className="text-xs text-muted-foreground tabular-nums">{offline.busy ? `${offline.done} van ${offline.total} geladen…` : complete ? 'Alle audio staat op dit apparaat.' : `${offline.cached} van ${offline.total} geluiden op dit apparaat.`}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
