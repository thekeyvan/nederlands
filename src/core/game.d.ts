import type {Lesson, Review, ReviewEvent, Theme} from './types';
export const courseLessons: Lesson[];
export const XP_CORRECT: number;
export const XP_ATTEMPT: number;
export function xpForGrade(grade: number): number;
export const levels: {name: string; xp: number}[];
export interface Level {index: number; number: number; name: string; floor: number; next: {name: string; xp: number} | null; toNext: number; progress: number}
export function totalXp(reviews: Record<string, Review>, events: ReviewEvent[]): number;
export function levelFor(xp: number): Level;
export interface Streak {count: number; today: boolean; atRisk: boolean}
export function streak(events: ReviewEvent[], now?: Date): Streak;
export function bestStreak(events: ReviewEvent[]): number;
export function themeStars(stats: {total: number; done: number; known: number}): 0 | 1 | 2 | 3;
export interface RouteStep {lesson: Lesson; index: number; done: number; known: number; total: number; complete: boolean}
export interface Route {steps: RouteStep[]; current: number; completed: number; finished: boolean}
export function routeProgress(reviews: Record<string, Review>): Route;
export type StampId = 'fiets' | 'tulp' | 'vuur' | 'molen' | 'stroopwafel' | 'kroon';
export const stamps: {id: StampId; title: string; description: string}[];
export interface Mission {id: string; title: string; icon: 'rotate' | 'sparkles' | 'message'; count: number; target: number; done: boolean}
export function dailyMissions(events: ReviewEvent[], now?: Date): Mission[];
export interface GameStats {
  xp: number; level: Level; streak: Streak; bestStreak: number; attempts: number; practisedCards: number; knownCards: number; learningCards: number; dueCards: number;
  starredThemes: number; themes: {theme: Theme; stats: {total: number; done: number; known: number}; stars: 0 | 1 | 2 | 3}[]; route: Route; routeFinished: boolean; earned: StampId[];
}
export function gameStats(reviews: Record<string, Review>, events: ReviewEvent[], now?: Date): GameStats;
