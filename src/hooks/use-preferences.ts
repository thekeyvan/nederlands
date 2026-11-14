import {useCallback, useEffect, useState} from 'react';
import {loadState, weekKey} from '@/core/state.js';
import {resources} from '@/core/data.js';
import {notePreferenceChange} from '@/core/preferences.js';
import type {PreferenceState} from '@/core/types';

const KEY = 'mijn-nederlands-v1';
const ids = resources.map((resource) => resource.id);
const storage = {getItem: (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}};
const read = () => loadState(storage, ids);

/** Saved resources, the weekly plan and the daily goal. Synced with the account like before. */
export function usePreferences() {
  const [state, setState] = useState<PreferenceState>(read);
  useEffect(() => {
    const reload = () => setState(read());
    const onStorage = (event: StorageEvent) => event.key === KEY && reload();
    const onVisible = () => !document.hidden && reload();
    window.addEventListener('learning-preferences-loaded', reload);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('learning-preferences-loaded', reload);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const update = useCallback((change: (current: PreferenceState) => PreferenceState) => {
    setState((current) => {
      const base = current.week === weekKey() ? current : {...current, week: weekKey(), done: []};
      const next = change(base);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
        notePreferenceChange();
      } catch {
        window.dispatchEvent(new CustomEvent('auth-message', {detail: 'Je browser kan je keuzes nu niet bewaren.'}));
      }
      return next;
    });
  }, []);
  return [state, update] as const;
}
