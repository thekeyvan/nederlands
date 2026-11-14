import type {Progress} from './types';
export function getProgress(): Progress;
export function getIdentity(): string;
export function subscribe(callback: (data: Progress) => void): () => void;
export function reviewCard(cardId: string, grade: number): void;
