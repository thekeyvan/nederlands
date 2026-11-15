export interface SiteWord {id: string; themeId: string; nl: string; kind?: string; forms?: [string, string]; meaning?: string; example?: string; translation?: string}
export interface SitePhrase {id: string; themeId: string; nl: string; meaning?: string}
export interface SiteLine {id: string; speaker: string; nl: string; translation: string}
export interface SiteThemeFull {id: string; title: string; meaning?: string; intro?: string; fa: string; group: string; words: SiteWord[]; phrases: SitePhrase[]; dialogue: SiteLine[]}
export interface SitePattern {id: string; slug: string; title: string; level: string; pattern: string; rule: string; note: string; examples: {nl: string; gap?: string; translation: string}[]}
export const groups: {id: string; fa: string; ids: string[]}[];
export const kindFa: Record<string, string>;
export const themes: SiteThemeFull[];
export const patterns: SitePattern[];
export const totals: {themes: number; words: number; phrases: number; dialogues: number; patterns: number; examples: number};
