// Registers /sw.js on the website and reports when a new version waits or the app works offline.
import {useCallback, useEffect, useRef, useState} from 'react';
import {Workbox} from 'workbox-window';

interface Options {onRegisteredSW?: (url: string, registration: ServiceWorkerRegistration | undefined) => void}

export function useRegisterSW({onRegisteredSW}: Options = {}) {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const workbox = useRef<Workbox | null>(null);
  const asked = useRef(false);
  const registered = useRef(onRegisteredSW);

  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
    const wb = new Workbox('/sw.js', {scope: '/'});
    workbox.current = wb;
    wb.addEventListener('waiting', () => setNeedRefresh(true));
    wb.addEventListener('installed', (event) => { if (!event.isUpdate) setOfflineReady(true); });
    // Reload only after the learner chose “Vernieuwen”, never in the middle of a round.
    wb.addEventListener('controlling', () => { if (asked.current) location.reload(); });
    void wb.register().then((registration) => registered.current?.('/sw.js', registration));
  }, []);

  const updateServiceWorker = useCallback(async (_reload?: boolean) => {
    asked.current = true;
    workbox.current?.messageSkipWaiting();
  }, []);

  return {needRefresh: [needRefresh, setNeedRefresh] as const, offlineReady: [offlineReady, setOfflineReady] as const, updateServiceWorker};
}
