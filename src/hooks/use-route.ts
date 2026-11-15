import {useSyncExternalStore} from 'react';

export type Panel = 'oefenen' | 'woorden' | 'zinnen' | 'route' | 'spellen' | 'voortgang' | 'instellingen' | 'bronnen';
export interface Route {panel: Panel; theme: string | null; topic: 'words' | 'phrases' | 'dialogue'; rule: string | null; step: number | null; section: 'bronnen' | 'week'; game: string | null}

const panels: Panel[] = ['oefenen', 'woorden', 'zinnen', 'route', 'spellen', 'voortgang', 'instellingen', 'bronnen'];
export const panelTitles: Record<Panel, string> = {
  oefenen: 'Oefenen', woorden: 'Thema’s', zinnen: 'Zinsbouw', route: 'Route', spellen: 'Spellen', voortgang: 'Ik', instellingen: 'Instellingen', bronnen: 'Websites & boeken',
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
  // Vandaag was the old start screen; Oefenen took its place.
  if (hash === 'vandaag') panel = 'oefenen';
  if (hash === 'week') {
    panel = 'bronnen';
    section = 'week';
  }
  const theme = params.get('thema');
  if (!panels.includes(panel)) panel = theme ? 'woorden' : 'oefenen';
  const step = Number(params.get('halte'));
  const route: Route = {panel, theme, topic, rule: params.get('regel'), step: Number.isInteger(step) && step > 0 ? step : null, section, game: params.get('spel')};
  cached = {key, route};
  return route;
}

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}
/** True when the last screen change came from Back (so the old scroll position comes back too). */
export let cameBack = false;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { cameBack = true; emit(); });
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

/** Where a screen sits in the app's own history: how deep, and the name of the screen it was opened from. */
interface NavState {depth?: number; from?: string; layer?: boolean; scroll?: number}
const navState = () => (history.state ?? {}) as NavState;
let describe: (route: Route) => string = (route) => panelTitles[route.panel];
/** nav.ts registers how screens are named (a theme's title, a pattern's title) for back buttons. */
export function setRouteDescriber(fn: (route: Route) => string) {
  describe = fn;
}

export function navigate(panel: Panel, options: {theme?: string | null; rule?: string | null; step?: number | null; game?: string | null; replace?: boolean; root?: boolean} = {}) {
  const url = new URL(location.href);
  for (const key of ['thema', 'regel', 'halte', 'spel']) url.searchParams.delete(key);
  if (options.game) url.searchParams.set('spel', options.game);
  if (options.theme) url.searchParams.set('thema', options.theme);
  if (options.rule) url.searchParams.set('regel', options.rule);
  if (options.step) url.searchParams.set('halte', String(options.step));
  url.hash = panel;
  const current = navState();
  // Remember where this screen was scrolled to, for when you come back to it.
  if (!options.replace) history.replaceState({...current, scroll: window.scrollY}, '');
  cameBack = false;
  const state: NavState = options.replace ? {depth: current.depth, from: current.from} : options.root ? {depth: 0} : {depth: (current.depth ?? 0) + 1, from: describe(parse())};
  history[options.replace ? 'replaceState' : 'pushState'](state, '', url);
  emit();
}

export const savedScroll = () => navState().scroll ?? 0;

/** The screen this one was opened from, if it was opened inside the app. */
export function openedFrom(): string | null {
  const state = navState();
  return state.depth && state.from ? state.from : null;
}

/** Back: to the screen you came from; when the app was opened right here, to the parent screen. */
export function goBack(parent: Panel | null) {
  if (navState().depth) history.back();
  else if (parent) navigate(parent, {replace: true});
}

/** Plain links for real <a href> elements (open in new tab still works). */
export function hrefFor(panel: Panel, options: {theme?: string; rule?: string; step?: number; game?: string} = {}) {
  const params = new URLSearchParams();
  if (options.game) params.set('spel', options.game);
  if (options.theme) params.set('thema', options.theme);
  if (options.rule) params.set('regel', options.rule);
  if (options.step) params.set('halte', String(options.step));
  const query = params.toString();
  return `./${query ? `?${query}` : ''}#${panel}`;
}
