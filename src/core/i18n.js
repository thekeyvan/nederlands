import {locales} from '../../locales/index.js';
import {siteConfig} from '../../site.config.js';
let savedLocale;try{savedLocale=localStorage.getItem('nederlands-locale');}catch{}
const requested = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('lang');
export const locale = locales[requested] || locales[savedLocale] || locales[siteConfig.defaultLocale] || Object.values(locales)[0];
const fallback = {
 searchResult:'Zoekresultaten',readSlowly:'Lees langzaam en herhaal het woord.',wordHint:'Klik of tik voor de betekenis.',empty:'Geen woorden gevonden.',
 queueDone:'Herhaal eerst oude kaartjes en leer daarna een paar nieuwe.',grammarHint:'Vul het ontbrekende woord in.',reverseHint:'Hoe zeg je dit in het Nederlands?',meaningHint:'Weet je de betekenis nog?',
 method:'Denk eerst na, bekijk het antwoord en kies hoe goed je het wist.',accountGuest:'Log in met Google om je voortgang mee te nemen.',accountSignedIn:'Je bent ingelogd. Je voortgang wordt bewaard.',
 rating1:'Nog niet',rating3:'Moeilijk',rating4:'Goed',rating5:'Makkelijk',phraseHint:'Lees de zin. Bekijk de betekenis en maak daarna je eigen zin.'
};
export const t = key => locale.ui[key] || fallback[key] || key;
export const translateCard = (card,pack=locale) => ({...card,...pack.cards[card.id]});
export {locales};
export function chooseLocale(code) {
 try{localStorage.setItem('nederlands-locale',code);}catch{}
 const url=new URL(location.href);url.searchParams.set('lang',code);location.href=url.href;
}
