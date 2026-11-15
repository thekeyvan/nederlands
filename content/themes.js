// Themes for the apps and the website, read from content/themes/*.json (see content/index.js).
import {themeFiles} from './index.js';

export const baseThemes = themeFiles.map(({id, title, icon, intro}) => ({id, title, icon, intro}));
