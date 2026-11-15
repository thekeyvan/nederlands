import type {Card, Review, ReviewEvent, Theme} from './types';
import type {IrregularSet} from './irregular';
export type StepId = 'woorden' | 'zinnen' | 'grammatica' | 'gesprek' | 'eindspel';
export interface PathTheme extends Theme {grammar: string[]; irregular: string | null}
export interface PathSection {id: string; nl: string; fa: string; level: string; themes: PathTheme[]}
export interface PathStep {id: StepId; number: number; title: string; detail: string; done: number; total: number; complete: boolean; rules?: Card[]; irregular?: IrregularSet | null}
export type StepRound =
  | {kind: 'round'; queue: Card[]; drill?: boolean; label?: string}
  | {kind: 'irregular'; set: string; label: string; queue: Card[]}
  | {kind: 'game'; game: 'gesprek'};
export const pathSections: PathSection[];
export const pathThemes: PathTheme[];
export function conversationId(themeId: string): string;
export function themesForRule(ruleId: string): PathTheme[];
export function themesForIrregular(setId: string): PathTheme[];
export function themeSteps(themeId: string, reviews: Record<string, Review>): PathStep[];
export function nextStep(steps: PathStep[]): PathStep | null;
export function themeComplete(themeId: string, reviews: Record<string, Review>): boolean;
export function currentTheme(reviews: Record<string, Review>, events: ReviewEvent[], level?: string | null): string;
export function stepRound(themeId: string, stepId: StepId, reviews: Record<string, Review>): StepRound | null;
