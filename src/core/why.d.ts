import type {Card, DialogueLine} from './types';
/** Why an answer is right or wrong: a Dutch label for the rule and Persian text with the Dutch in **bold**. */
export interface Why {tag: string; fa: string}
export function nl(text: string): string;
export function verbWhy(facts: {verb: string; past: string; perfect: string; note?: string}, kind: 'perfect' | 'past', mistake: string | null): Why | null;
export function articleWhy(noun: string, article: string, verbs?: Set<string>): Why;
export function meaningWhy(card: Card, other: Card | undefined, field: 'meaning' | 'nl'): Why | null;
export function gapWordWhy(label: string, answer: string, lookup: (word: string) => Card | null): Why | null;
export function dialogueWhy(line: DialogueLine | undefined): Why | null;
export function ruleWhy(card: Partial<Card> | undefined): Why | null;
export function orderWhy(sentence: string): Why | null;
export function spellingWhy(input: string, answer: string): Why | null;
export function irregularVerbWhy(facts: {verb: string; past: string; pastPlural: string; perfect: string; regular: {past: string; participle: string; present: string}}, ask: number, label: string, correct: boolean): Why;
export function setWhy(title: string, fa: string): Why | null;
export function spellingDiff(typed: string, answer: string): {text: string; wrong: boolean}[];
