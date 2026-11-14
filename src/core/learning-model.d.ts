import type {Card, Review, ReviewEvent, Theme} from './types';
export const cards: Card[];
export const groupNames: Record<'werk' | 'dagelijks' | 'vrijetijd' | 'taal', string>;
export function themeMeta(theme: Pick<Theme, 'id'>): {icon: string; group: keyof typeof groupNames; label: string; color: 'lavender' | 'mint' | 'blue' | 'peach'};
export function themeStats(id: string, reviews: Record<string, Review>): {total: number; done: number; known: number};
export function dayKey(date: Date): string;
export function activity(events: ReviewEvent[], now?: Date): {today: number; week: {date: Date; label: string; count: number}[]};
export function resumeTheme(events: Pick<ReviewEvent, 'cardId'>[]): string;
export function planSession(reviews: Record<string, Review>, options?: {theme?: string; type?: string; now?: Date; limit?: number; cardIds?: string[] | null}): Card[];
