import type {Card, Review} from './types';
export interface IrregularRow {id: string; cells: string[]; fa: string}
export interface IrregularSet {id: string; kind: 'verb' | 'present' | 'plural' | 'compare'; group: 'werkwoorden' | 'meer'; title: string; pattern: string; level: string; rule: string; cards: Card[]; rows: IrregularRow[]}
export const irregularSets: IrregularSet[];
export const irregularCards: Card[];
export const irregularIntro: string;
export function irregularSet(id: string): IrregularSet | null;
export function regularForms(infinitive: string): {stem: string; past: string; participle: string; present: string};
export function checkForm(input: string, card: Card): {result: 'correct' | 'close' | 'wrong'; hint?: 'aux'};
export function irregularProgress(set: IrregularSet, reviews: Record<string, Review>, now?: Date): {total: number; done: number; known: number; due: number; stars: number};
export function irregularRound(setId: string, reviews: Record<string, Review>, options?: {now?: Date; limit?: number}): Card[];
export function formInput(review: Review | undefined): 'choose' | 'type';
