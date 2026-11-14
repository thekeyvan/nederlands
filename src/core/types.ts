export interface Theme {id: string; title: string; icon: string; intro: string; meaning: string}
export type WordKind = 'woord' | 'werkwoord' | 'uitdrukking';
/** One review card: a word, a practical sentence (phrase:) or a grammar pattern (zin:). */
export interface Card {
  id: string; themeId: string; nl?: string; kind?: string; example?: string; forms?: string[];
  meaning?: string; translation?: string; themeTitle?: string; level?: string;
  title?: string; pattern?: string; prompt?: string; answer?: string; rule?: string; note?: string;
}
export interface Review {ease: number; interval: number; repetitions: number; due: string; lastReviewed: string; grade: number; reviews: number}
export interface ReviewEvent {id: string; cardId: string; grade: number; at: string}
export interface Progress {reviews: Record<string, Review>; events: ReviewEvent[]}
export interface DialogueLine {id: string; speaker: string; nl: string; translation: string}
export interface Dialogue {id: string; themeId: string; lines: DialogueLine[]}
export interface Lesson {id: string; title: string; level: string; grammarIds: string[]; themeIds: string[]; cardIds: string[]; goal: string; task: string}
export interface Resource {id: string; name: string; categories: string[]; level: 'A2' | 'B1'; cost: string; description: string; url: string; steps: string[]; start?: boolean; time: string; note?: string; alternate?: {label: string; url: string}}
export interface Idea {type: string; title: string; description: string; resource: string}
export interface WeekTask {id: string; title: string; copy: string; time: string}
export interface Locale {code: string; name: string; dutchName: string; dir: 'ltr' | 'rtl'; font: string; ui: Record<string, string>}
export interface PreferenceState {saved: string[]; week: string; done: string[]; goal: number}
