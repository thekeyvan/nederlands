import {vocabulary} from './learning-data.js';
import {sentences} from './sentence-data.js';
import {scheduleReview,validReviews,mergeReviews} from './srs.js';
const validIds=new Set([...vocabulary,...sentences].map(card=>card.id));
let identity='guest', listeners=new Set(), data=read('guest');
function read(id){try{const parsed=JSON.parse(localStorage.getItem(`nederlands-learning:${id}`)||'{}');return {reviews:validReviews(parsed.reviews,validIds),events:Array.isArray(parsed.events)?parsed.events.filter(event=>validIds.has(event.cardId)&&[1,3,4,5].includes(event.grade)&&Number.isFinite(Date.parse(event.at))&&typeof event.id==='string').slice(-2000):[]};}catch{return {reviews:{},events:[]};}}
function save(){try{localStorage.setItem(`nederlands-learning:${identity}`,JSON.stringify(data));}catch{window.dispatchEvent(new CustomEvent('learning-storage-error'));}}
function emit(){for(const callback of listeners)callback(data);}
export const getProgress=()=>data;
export const getIdentity=()=>identity;
export function subscribe(callback){listeners.add(callback);return ()=>listeners.delete(callback);}
export function reviewCard(cardId,grade){
 if(!validIds.has(cardId))throw new Error('Unknown card');
 const now=new Date();data.reviews[cardId]=scheduleReview(data.reviews[cardId],grade,now);
 data.events.push({id:crypto.randomUUID(),cardId,grade,at:now.toISOString()});data.events=data.events.slice(-2000);save();emit();
 window.dispatchEvent(new CustomEvent('learning-review'));
}
export function switchUser(id){
 if(id===identity)return;
 const guest=identity==='guest'?data:null;
 identity=id||'guest';data=read(identity);
 if(id&&guest){data.reviews=mergeReviews(data.reviews,guest.reviews);data.events=mergeEvents(data.events,guest.events);}
 save();emit();
}
export function mergeCloud(reviews,events){data.reviews=mergeReviews(data.reviews,validReviews(reviews,validIds));data.events=mergeEvents(data.events,events);save();emit();}
function mergeEvents(a,b){return [...new Map([...a,...b].map(event=>[event.id,event])).values()].sort((a,b)=>new Date(a.at)-new Date(b.at)).slice(-2000);}
export function clearGuestAfterSync(){try{for(const key of ['nederlands-learning:guest','nederlands-preferences:guest','nederlands-preferences-updated:guest'])localStorage.removeItem(key);}catch{}}
window.addEventListener('storage',event=>{if(event.key===`nederlands-learning:${identity}`){data=read(identity);emit();}});
