import type {PreferenceState, Resource} from './types';
export const dailyGoals: number[];
export function weekKey(date?: Date): string;
export function loadState(storage: {getItem(key: string): string | null}, validIds: string[], currentWeek?: string): PreferenceState;
export function matchingResources(resources: Resource[], filters: {category: string; level: string; query: string}, saved: string[]): Resource[];
