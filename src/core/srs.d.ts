import type {Card, Review} from './types';
export const ratings: {grade: 1 | 3 | 4 | 5; label: string}[];
export function scheduleReview(previous: Review | undefined | Record<string, never>, grade: number, now?: Date): Review;
export function progressStatus(review?: Review): 'new' | 'learning' | 'known';
export function makeQueue<T extends Card>(cards: T[], reviews: Record<string, Review>, options?: {now?: Date; limit?: number; newLimit?: number; theme?: string}): T[];
