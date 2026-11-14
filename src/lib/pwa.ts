// Install prompt and app-mode detection. The browser fires beforeinstallprompt once and early,
// so it is captured when this module loads, before React renders.
import {useSyncExternalStore} from 'react';

interface InstallPromptEvent extends Event {prompt: () => Promise<void>; userChoice: Promise<{outcome: 'accepted' | 'dismissed'}>}

export const AUDIO_CACHE = 'nederlands-audio'; // Same name as in sw.ts.

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export const isStandalone = () =>
  typeof window !== 'undefined' && (matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & {standalone?: boolean}).standalone === true);
const isIos = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

let snapshot = {canInstall: false, standalone: false, ios: false, installed: false};
function read() {
  const next = {canInstall: Boolean(deferred), standalone: isStandalone(), ios: isIos(), installed};
  if (next.canInstall !== snapshot.canInstall || next.standalone !== snapshot.standalone || next.ios !== snapshot.ios || next.installed !== snapshot.installed) snapshot = next;
  return snapshot;
}

export function useInstall() {
  const state = useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener); }, read, read);
  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null;
    emit();
    return choice.outcome === 'accepted';
  };
  return {...state, install};
}

/** Ask the browser to keep this site's storage (progress, offline audio) when space runs low. */
export async function persistStorage() {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
