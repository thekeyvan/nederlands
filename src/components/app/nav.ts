import {Award, Compass, Gamepad2, Library, Map, Puzzle, Sun, Zap, type LucideIcon} from 'lucide-react';
import type {Panel, Route} from '@/hooks/use-route';

export interface NavItem {panel: Panel; label: string; icon: LucideIcon}
export const mainNav: NavItem[] = [
  {panel: 'vandaag', label: 'Vandaag', icon: Sun},
  {panel: 'woorden', label: 'Thema’s', icon: Compass},
  {panel: 'zinnen', label: 'Zinsbouw', icon: Puzzle},
  {panel: 'route', label: 'De route', icon: Map},
  {panel: 'oefenen', label: 'Oefenen', icon: Zap},
  {panel: 'spellen', label: 'Spellen', icon: Gamepad2},
  {panel: 'voortgang', label: 'Ik', icon: Award},
];
export const extraNav: NavItem[] = [{panel: 'bronnen', label: 'Websites & boeken', icon: Library}];

/** Phone tabs. "Leren" holds Thema’s, Zinsbouw and De route (switched with tabs on those screens). */
export const mobileTabs: NavItem[] = [
  {panel: 'vandaag', label: 'Vandaag', icon: Sun},
  {panel: 'woorden', label: 'Leren', icon: Compass},
  {panel: 'oefenen', label: 'Oefen', icon: Zap},
  {panel: 'spellen', label: 'Spellen', icon: Gamepad2},
  {panel: 'voortgang', label: 'Ik', icon: Award},
];

/** Which phone tab a screen belongs to, so you always see where you are. */
export function tabOf(panel: Panel): Panel {
  if (panel === 'zinnen' || panel === 'route') return 'woorden';
  if (panel === 'bronnen') return 'voortgang';
  return panel;
}

/** The screen one level up, for the back button. Null on the top level of a tab. */
export function parentOf(route: Route): {panel: Panel; label: string} | null {
  if (route.panel === 'woorden' && route.theme) return {panel: 'woorden', label: 'Thema’s'};
  if (route.panel === 'bronnen') return {panel: 'voortgang', label: 'Ik'};
  return null;
}
