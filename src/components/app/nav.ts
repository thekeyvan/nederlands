import {BookOpen, Gamepad2, UserRound, Zap, type LucideIcon} from 'lucide-react';
import {setRouteDescriber, type Panel, type Route, panelTitles} from '@/hooks/use-route';
import {themes} from '@/core/learning-data.js';
import {sentences} from '@/core/sentence-data.js';
import {irregularSet} from '@/core/irregular.js';

export interface NavItem {panel: Panel; label: string; icon: LucideIcon}

/** The four sections, the same in the phone's tab bar and the laptop's sidebar. */
export const tabs: NavItem[] = [
  {panel: 'oefenen', label: 'Vandaag', icon: Zap},
  {panel: 'woorden', label: 'Leren', icon: BookOpen},
  {panel: 'spellen', label: 'Arcade', icon: Gamepad2},
  {panel: 'voortgang', label: 'Ik', icon: UserRound},
];

/** Which tab a screen belongs to, so you always see where you are. */
export function tabOf(panel: Panel): Panel {
  if (panel === 'zinnen' || panel === 'route') return 'woorden';
  if (panel === 'instellingen' || panel === 'bronnen') return 'voortgang';
  return panel;
}

/** The screen one level up. Null on the first screen of a tab (Leren's three parts all count as its first screen). */
export function parentOf(route: Route): Panel | null {
  if (route.panel === 'woorden' && route.theme) return 'woorden';
  if (route.panel === 'zinnen' && route.rule) return 'zinnen';
  if (route.panel === 'instellingen') return 'voortgang';
  if (route.panel === 'bronnen') return 'instellingen';
  return null;
}

/** The name a back button shows for this screen. */
export function titleOf(route: Route): string {
  if (route.panel === 'woorden' && route.theme) return themes.find((theme) => theme.id === route.theme)?.title ?? 'Thema';
  if (route.panel === 'zinnen' && route.rule === 'onregelmatig') return 'Onregelmatig';
  if (route.panel === 'zinnen' && route.rule?.startsWith('onregelmatig:')) return irregularSet(route.rule.slice(13))?.title ?? 'Onregelmatig';
  if (route.panel === 'zinnen' && route.rule) return sentences.find((card) => card.id === route.rule)?.title ?? 'Grammatica';
  return panelTitles[route.panel];
}

setRouteDescriber(titleOf);
