import type {PreferenceState} from './types';
export function preferenceSnapshot(): {data: PreferenceState; updated_at: string | null};
export function notePreferenceChange(): void;
export function switchPreferences(userId: string | null | undefined): void;
export function mergePreferences(remote: unknown): void;
