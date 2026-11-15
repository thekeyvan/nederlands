import type {Level} from './types';
export interface PlacementQuestion {level: Level; kind: 'meaning' | 'fill' | 'understand'; prompt: string; answer: string; options: string[]}
export const LEVELS: Level[];
export const levelInfo: Record<Level, {name: string; fa: string; text: string}>;
export function validLevel(value: unknown): Level | null;
export const placementQuestions: PlacementQuestion[];
export const passMark: number;
export function placementResult(answers: Partial<Record<Level, number>>): Level;
export function placementDone(level: Level, right: number, asked: number): boolean;
export function levelOrder(level: Level | null): Level[] | null;
export function sortForLevel<T extends {id: string; level?: string}>(themes: T[], level: Level | null): T[];
export function suggestedThemes<T extends {id: string; level?: string}>(themes: T[], level: Level | null, progress: (id: string) => {done: number; total: number} | undefined, count?: number): T[];
export function startTheme<T extends {id: string; level?: string}>(themes: T[], level: Level | null): string;
