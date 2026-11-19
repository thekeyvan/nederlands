export interface NewsShow {id: 'makkelijk' | 'jeugd' | 'nos'; title: string; short: string; detail: string; minutes: number; url: string}
export type NewsState = 'idle' | 'asked' | 'done';
export interface NewsMark {day: string; state: NewsState}
export const newsShows: NewsShow[];
export const newsTip: string;
export function newsFor(level: string | null): NewsShow;
export function newsState(saved: NewsMark | null | undefined, now?: Date): NewsState;
export function newsMark(state: NewsState, now?: Date): NewsMark;
