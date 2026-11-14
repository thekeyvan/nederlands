import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
const KEY = 'nederlands-theme';
const read = (): ThemePreference => {
  try {
    const value = localStorage.getItem(KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
};
const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
const resolve = (preference: ThemePreference) => (preference === 'system' ? (systemDark() ? 'dark' : 'light') : preference);

/** Apply the saved theme before React renders, to avoid a light flash in dark mode. */
export function applyInitialTheme() {
  document.documentElement.classList.toggle('dark', resolve(read()) === 'dark');
}

const ThemeContext = createContext<{preference: ThemePreference; resolved: 'light' | 'dark'; setPreference: (value: ThemePreference) => void}>({
  preference: 'system',
  resolved: 'light',
  setPreference: () => {},
});

export function ThemeProvider({children}: {children: ReactNode}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(read);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(read()));
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      const next = resolve(preference);
      setResolved(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#111a28' : '#fcfaf6');
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [preference]);
  const setPreference = useCallback((value: ThemePreference) => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* The choice still applies for this visit. */
    }
    setPreferenceState(value);
  }, []);
  const value = useMemo(() => ({preference, resolved, setPreference}), [preference, resolved, setPreference]);
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export const useTheme = () => useContext(ThemeContext);
