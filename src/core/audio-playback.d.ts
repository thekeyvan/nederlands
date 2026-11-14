export type PlaybackState = 'idle' | 'loading' | 'playing' | 'ended' | 'error';
export const audioSpeeds: number[];
export function validSpeed(value: unknown): number;
export function validVoice(id: unknown): string;
export function audioUrl(text: string, voice: string): string | null;
export interface Playback {cancel(): void; setSpeed(value: number): void; play(text: string, voice: string, speed?: number): Promise<boolean>}
export function createPlayback(audio: HTMLAudioElement, onState?: (state: PlaybackState) => void): Playback;
