import routeMap from '@/assets/illustrations/route-map.jpg';
import type {StampId} from '@/core/game.js';

const themeImages = import.meta.glob<string>('@/assets/illustrations/themes/*.jpg', {eager: true, import: 'default'});
const mascotImages = import.meta.glob<string>('@/assets/illustrations/mascot/*.jpg', {eager: true, import: 'default'});
const gameImages = import.meta.glob<string>('@/assets/illustrations/games/*.jpg', {eager: true, import: 'default'});
const stampImages = import.meta.glob<string>('@/assets/illustrations/stamps/*.jpg', {eager: true, import: 'default'});
const mascotCutImages = import.meta.glob<string>('@/assets/illustrations/mascot-cut/*.png', {eager: true, import: 'default'});
const practiceImages = import.meta.glob<string>('@/assets/illustrations/oefenen/*.jpg', {eager: true, import: 'default'});

const byName = (images: Record<string, string>) =>
  Object.fromEntries(Object.entries(images).map(([path, url]) => [path.split('/').pop()!.replace(/\.(jpg|png)$/, ''), url]));

const themes = byName(themeImages);
const mascots = byName(mascotImages);
const stamps = byName(stampImages);
const gameScenes = byName(gameImages);
const practiceScenes = byName(practiceImages);

/** A theme scene, or a section scene (zinsbouw, bronnen, week, spreken). Undefined for new fork themes. */
export const sceneFor = (id: string): string | undefined => themes[id];
export type MascotMood = 'wave' | 'cheer' | 'think' | 'sleep';
export const mascotFor = (mood: MascotMood) => mascots[mood];
/** The cut-out mascot (transparent background) in a pose, for the moments where it reacts. */
export type MascotPose = 'idle' | 'cheer' | 'oops' | 'think' | 'wave';
const mascotCuts = byName(mascotCutImages);
export const mascotPose = (pose: MascotPose) => mascotCuts[pose];
export const stampFor = (id: StampId) => stamps[id];
/** Game scenes; the cloze game reuses the grammar building-blocks scene. */
export const gameScene = (id: string) => gameScenes[id] ?? themes['spreken'];
export {routeMap};
/** Pictures for the focused rounds on Oefenen (woorden, zinnen, fouten); zinsbouw uses the section scene. */
export const practiceScene = (id: string) => practiceScenes[id] ?? themes[id];
export {default as logo} from '@/assets/logo.png';
