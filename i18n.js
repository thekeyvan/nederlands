import {locales} from './locales/index.js';
import {siteConfig} from './site.config.js';
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
export function translationElement(tag,text,className='') {
 const element=document.createElement(tag);element.className=`translation ${className}`;element.textContent=text || '';element.lang=locale.code;element.dir=locale.dir;return element;
}
export function initTranslations() {
 document.documentElement.style.setProperty('--translation-font',locale.font);
 document.querySelectorAll('[data-translation]').forEach(element=>{element.textContent=t(element.dataset.translation);element.lang=locale.code;element.dir=locale.dir;});
 document.querySelectorAll('[data-language-name]').forEach(element=>element.textContent=locale.dutchName);
 const search=document.querySelector('#word-search');if(search){search.placeholder=`Nederlands / ${locale.name}`;search.setAttribute('aria-label',`Zoek in het Nederlands of ${locale.dutchName}`);}
 const options=document.querySelectorAll('#review-direction option');if(options.length){options[0].textContent=`Nederlands → ${locale.name}`;options[1].textContent=`${locale.name} → Nederlands`;}
 const selector=document.querySelector('#translation-language');if(selector){for(const pack of Object.values(locales)){const option=document.createElement('option');option.value=pack.code;option.textContent=pack.name;selector.append(option);}selector.value=locale.code;selector.closest('label').hidden=Object.keys(locales).length<2;selector.addEventListener('change',()=>{try{localStorage.setItem('nederlands-locale',selector.value);}catch{}const url=new URL(location.href);url.searchParams.set('lang',selector.value);location.href=url;});}
}
