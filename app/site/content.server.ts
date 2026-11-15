// Lesson content for the public pages, trimmed to what each page shows. Server only: never shipped to the browser.
import {groups, kindFa, patterns, themes, totals} from '../../src/site/content.js';
import type {SiteThemeFull} from '../../src/site/content.js';
import type {SiteTheme} from './ui';

export {groups, kindFa, patterns, themes, totals};
export const card = (theme: SiteThemeFull): SiteTheme => ({id: theme.id, title: theme.title, fa: theme.fa, words: theme.words.length});
export const themeById = (id: string | undefined) => themes.find((theme) => theme.id === id);
export const patternBySlug = (slug: string | undefined) => patterns.find((pattern) => pattern.slug === slug);
export const notFound = () => new Response('Niet gevonden', {status: 404});
