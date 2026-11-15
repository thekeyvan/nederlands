// Themes for the apps and the website, read from content/themes/*.json (see content/index.js).
import {themeFiles} from './index.js';

// `level`: A0 (starting from zero), A1, A2 (the default) or B1; used to suggest themes that fit the learner.
// `grammar`: the rules you need in this situation; `irregular`: an Onregelmatig set that goes with it (step 3 of the path).
export const baseThemes = themeFiles.map(({id, title, icon, intro, level, grammar, irregular}) => ({id, title, icon, intro, level: level ?? 'A2', grammar: grammar ?? [], irregular: irregular ?? null}));
