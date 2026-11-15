// Language helpers for the public pages in Dutch (/, the default) and Persian (/fa/).
export const SITE = 'https://nedfa.nl';
export const BRAND_FA = 'نِدفا';
export const EMAIL = 'hallo@nedfa.nl';
export const LANGS = ['nl', 'fa'] as const;
export type Lang = (typeof LANGS)[number];

/** The language of a request or location: Persian under /fa/, else Dutch. */
export const langOf = (pathname: string): Lang => (/^\/fa(\/|$)/.test(pathname) ? 'fa' : 'nl');
/** Pick the Persian or Dutch text. */
export const tx = <T,>(lang: Lang, fa: T, nl: T): T => (lang === 'fa' ? fa : nl);
/** A path in the given language: Dutch pages live at the root, Persian ones under /fa/. */
export const at = (lang: Lang, path: string) => (lang === 'nl' ? path : `/fa${path}`);
/** Numbers in Persian digits on Persian pages. */
export const num = (lang: Lang, value: number) => Number(value).toLocaleString(lang === 'fa' ? 'fa-IR' : 'nl-NL');

export const appLink = (query = '') => `/leren${query}`;
export const themePath = (id: string) => `/woorden/${id}/`;
export const patternPath = (slug: string) => `/grammatica/${slug}/`;
// Themes without their own picture yet (e.g. a new beginner theme) show the waving mascot instead of a broken image.
const themePictures = new Set(Object.keys(import.meta.glob('/src/assets/illustrations/themes/*.jpg')).map((file) => file.split('/').pop()!.replace(/\.jpg$/, '')));
export const themeImage = (id: string) => (themePictures.has(id) ? `/img/themes/${id}.jpg` : '/img/mascot-wave.jpg');
export const groupNl: Record<string, string> = {beginnen: 'Beginnen', dagelijks: 'Elke dag', werk: 'Werk', vrijetijd: 'Vrije tijd & uitgaan', taal: 'Taal, contact & gevoel'};
export const kindNl: Record<string, string> = {woord: 'woord', werkwoord: 'werkwoord', uitdrukking: 'uitdrukking'};
export const organization = {'@type': 'Organization', '@id': `${SITE}/#org`, name: 'Nedfa', alternateName: BRAND_FA, url: SITE, logo: `${SITE}/img/logo.png`, email: EMAIL};
