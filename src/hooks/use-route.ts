import {useSyncExternalStore} from 'react';

export type Panel = 'vandaag' | 'woorden' | 'oefenen' | 'zinnen' | 'route' | 'voortgang' | 'bronnen';
export interface Route {panel: Panel; theme: string | null; topic: 'words' | 'phrases' | 'dialogue'; rule: string | null; step: number | null; section: 'bronnen' | 'week'}

const panels: Panel[] = ['vandaag', 'woorden', 'oefenen', 'zinnen', 'route', 'voortgang', 'bronnen'];
export const panelTitles: Record<Panel, string> = {
  vandaag: 'Vandaag', woorden: 'Thema’s', oefenen: 'Oefenen', zinnen: 'Zinsbouw', route: 'De route', voortgang: 'Ik', bronnen: 'Bronnen',
};

let cached: {key: string; route: Route} | null = null;
function parse(): Route {
  const key = location.search + location.hash;
  if (cached?.key === key) return cached.route;
  const params = new URLSearchParams(location.search);
  const hash = location.hash.slice(1);
  let panel = hash as Panel;
  let topic: Route['topic'] = 'words';
  let section: Route['section'] = 'bronnen';
  // Older links keep working: #thema-zinnen opened a theme's sentences, #week the weekly plan.
  if (hash === 'thema-zinnen') {
    panel = 'woorden';
    topic = 'phrases';
  }
  if (hash === 'week') {
    panel = 'bronnen';
    section = 'week';
  }
  const theme = params.get('thema');
  if (!panels.includes(panel)) panel = theme ? 'woorden' : 'vandaag';
  const step = Number(params.get('halte'));
  const route: Route = {panel, theme, topic, rule: params.get('regel'), step: Number.isInteger(step) && step > 0 ? step : null, section};
  cached = {key, route};
  return route;
}

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', emit);
  window.addEventListener('hashchange', emit);
}

export function useRoute() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    parse,
    parse,
  );
}

export function navigate(panel: Panel, options: {theme?: string | null; rule?: string | null; step?: number | null; replace?: boolean} = {}) {
  const url = new URL(location.href);
  for (const key of ['thema', 'regel', 'halte']) url.searchParams.delete(key);
  if (options.theme) url.searchParams.set('thema', options.theme);
  if (options.rule) url.searchParams.set('regel', options.rule);
  if (options.step) url.searchParams.set('halte', String(options.step));
  url.hash = panel;
  history[options.replace ? 'replaceState' : 'pushState'](null, '', url);
  emit();
}

/** Plain links for real <a href> elements (open in new tab still works). */
export function hrefFor(panel: Panel, options: {theme?: string; rule?: string; step?: number} = {}) {
  const params = new URLSearchParams();
  if (options.theme) params.set('thema', options.theme);
  if (options.rule) params.set('regel', options.rule);
  if (options.step) params.set('halte', String(options.step));
  const query = params.toString();
  return `./${query ? `?${query}` : ''}#${panel}`;
}
