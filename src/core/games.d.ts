import type {Card, Dialogue, DialogueLine} from './types';
import type {Option} from './practice.js';
import type {Why} from './why.js';
export interface ArticleItem {card: Card; article: 'de' | 'het'; noun: string; why: Why}
export function articleItems(words: Card[]): ArticleItem[];
export interface BuilderItem {card: Card; first: string; answer: string[]; tiles: {id: string; text: string}[]; ending: string; sentence: string; why: Why | null}
export function builderItem(card: Card, text: string | undefined, seed?: string): BuilderItem | null;
export function builderCorrect(item: BuilderItem, chosen: string[]): boolean;
export interface VerbItem {card: Card; past: string; perfect: string; note: string}
export function verbItems(verbs: Card[]): VerbItem[];
export interface Choice {label: string; correct: boolean; why?: Why | null}
export function verbQuestion(item: VerbItem, kind: 'perfect' | 'past', seed?: string): {item: VerbItem; kind: 'perfect' | 'past'; answer: string; options: Choice[]};
export interface ClozeItem {card: Card; before: string; after: string; answer: string; options: Choice[]}
export function clozeItem(card: Card, pool: Card[], seed?: string): ClozeItem | null;
export interface DialogueStep {line: DialogueLine; options: {line: DialogueLine; correct: boolean; why: Why | null}[] | null}
export function dialogueSteps(dialogue: Dialogue, dialogues: Dialogue[], seed?: string): DialogueStep[];
export function dictationItems(cards: Card[]): Card[];
export function checkDictation(input: string, card: Card): {result: 'correct' | 'close' | 'wrong'; hint?: string};
export function raceQuestion(card: Card, pool: Card[], seed: string): {card: Card; options: Option[]};
export interface GameRecord {best: number; played: number; last?: string}
export function recordScore(records: Record<string, GameRecord>, id: string, score: number, now?: Date): {records: Record<string, GameRecord>; isBest: boolean; previousBest: number};
export function validRecords(input: unknown): Record<string, GameRecord>;
export function roundPool<T>(all: T[], themeId: string, minimum: number): {items: T[]; narrowed: boolean};
export function pick<T>(list: T[], count: number, random?: () => number): T[];
