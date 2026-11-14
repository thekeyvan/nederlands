import type {Card, Review} from './types';
export type Mode = 'choose' | 'reverse' | 'listen' | 'type' | 'gap' | 'flash';
export function cardKind(card: Card): 'grammar' | 'phrase' | 'word';
export function chooseMode(card: Card, review: Review | undefined, position?: number): Mode;
export interface Option {id: string; label: string; correct: boolean}
export function buildOptions(card: Card, pool: Card[], field: 'meaning' | 'nl', options?: {count?: number; seed?: string}): Option[];
export function normalizeAnswer(text: string): string;
export function checkTyped(input: string, answer: string): {result: 'correct' | 'close' | 'wrong'; hint?: 'article' | 'typo'};
export function gradeAnswer(result: 'correct' | 'close' | 'wrong', options?: {hinted?: boolean}): 1 | 3 | 4;
export function pairsFrom(cards: Card[], pool: Card[], options?: {count?: number; seed?: string}): Card[];
export function seededRandom(seed: string): () => number;
export function shuffle<T>(list: T[], random?: () => number): T[];
