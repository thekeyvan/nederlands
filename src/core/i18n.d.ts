import type {Card, Locale} from './types';
export const locale: Locale;
export const locales: Record<string, Locale>;
export function t(key: string): string;
export function translateCard(card: Card, pack?: unknown): Card;
export function chooseLocale(code: string): void;
