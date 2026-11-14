import {Award, Compass, Gamepad2, Library, Map, Puzzle, Sun, Zap, type LucideIcon} from 'lucide-react';
import type {Panel} from '@/hooks/use-route';

export interface NavItem {panel: Panel; label: string; icon: LucideIcon}
export const mainNav: NavItem[] = [
  {panel: 'vandaag', label: 'Vandaag', icon: Sun},
  {panel: 'woorden', label: 'Thema’s', icon: Compass},
  {panel: 'oefenen', label: 'Oefenen', icon: Zap},
  {panel: 'spellen', label: 'Spellen', icon: Gamepad2},
  {panel: 'route', label: 'De route', icon: Map},
  {panel: 'zinnen', label: 'Zinsbouw', icon: Puzzle},
  {panel: 'voortgang', label: 'Ik & stempels', icon: Award},
];
export const extraNav: NavItem[] = [{panel: 'bronnen', label: 'Websites & boeken', icon: Library}];
