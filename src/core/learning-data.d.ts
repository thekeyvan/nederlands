import type {Card, Theme} from './types';
export const themes: Theme[];
export const vocabulary: Card[];
export function searchVocabulary(query: string, themeId?: string, kind?: string): Card[];
