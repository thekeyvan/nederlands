// Het nieuws van vandaag: one short Dutch news video a day, opened in YouTube (outside the app).
// The iPhone and Android apps keep the same list (ios-native/Nedfa/Model/News.swift, android/.../data/News.kt).
import {dayKey} from './learning-model.js';

export const newsShows = [
 {id:'makkelijk',title:'NOS Journaal in Makkelijke Taal',short:'Makkelijke Taal',detail:'Het nieuws, rustig verteld',minutes:10,url:'https://www.youtube.com/@NOSJournaalinMakkelijkeTaal/videos'},
 {id:'jeugd',title:'Jeugdjournaal',short:'Jeugdjournaal',detail:'Nieuws met veel beeld',minutes:10,url:'https://www.youtube.com/@jeugdjournaal/videos'},
 {id:'nos',title:'NOS Journaal',short:'NOS Journaal',detail:'Het gewone journaal, in gewoon tempo',minutes:20,url:'https://www.youtube.com/@NOS/videos'}
];

/** Persian tip on the card: turn on Dutch subtitles and watch twice. */
export const newsTip='زیرنویس هلندی را روشن کن و دو بار ببین.';

/** The show for a level: Makkelijke Taal up to A2 (and before the niveautest), Jeugdjournaal from B1. */
export function newsFor(level){
 return newsShows.find(show=>show.id===(level==='B1'?'jeugd':'makkelijk'));
}

/**
 * Where today's card is: 'idle' (not opened), 'asked' (opened, did you watch it?) or 'done'.
 * `saved` is {day, state} as stored on this device; anything from another day counts as idle.
 */
export function newsState(saved,now=new Date()){
 if(!saved||saved.day!==dayKey(now))return 'idle';
 return saved.state==='done'?'done':saved.state==='asked'?'asked':'idle';
}

export function newsMark(state,now=new Date()){
 return {day:dayKey(now),state};
}
