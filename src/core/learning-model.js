import {themes,vocabulary} from './learning-data.js';
import {phrases} from './phrase-data.js';
import {sentences} from './sentence-data.js';
import {makeQueue,progressStatus} from './srs.js';
import {groups as courseGroups} from '../../content/index.js';
export const cards=[...vocabulary,...phrases,...sentences.map(card=>({...card,themeId:'zinsbouw'}))];
// Groups come from content/index.js, so a new theme only has to be listed there.
const categoryMap=Object.fromEntries(courseGroups.map(group=>[group.id,group.themes]));
export const groupNames={beginnen:'Beginnen',werk:'Werk & samenwerken',dagelijks:'Elke dag',vrijetijd:'Vrije tijd & onderweg',taal:'Taal & contact'};
const icons={werk:'briefcase-business',overleg:'users',loopbaan:'building-2',beroepen:'briefcase-business',wonen:'house','huis-kopen':'key-round',vrijetijd:'bike',cultuur:'music',reizen:'train-front',natuur:'trees',uitgaan:'utensils',contact:'message-circle',mening:'scale',tijd:'clock',gezondheid:'heart-handshake',geld:'wallet',modalen:'message-circle',huisarts:'stethoscope',apotheek:'pill',gemeente:'landmark',boodschappen:'shopping-cart',school:'school',weer:'cloud-sun',kleding:'shirt',verkeer:'bike',feest:'party-popper',digitaal:'mail',solliciteren:'file-text',huishouden:'sparkles',noodgeval:'siren',familie:'heart',inburgering:'graduation-cap'};
export function themeMeta(theme){const group=Object.keys(categoryMap).find(key=>categoryMap[key].includes(theme.id)) || 'dagelijks';return {icon:icons[theme.id] || 'book-open',group,label:groupNames[group],color:group==='beginnen'?'mint':group==='werk'?'lavender':group==='vrijetijd'?'mint':group==='taal'?'blue':'peach'};}
export function themeStats(id,reviews){const list=cards.filter(card=>card.themeId===id);return {total:list.length,done:list.filter(card=>reviews[card.id]).length,known:list.filter(card=>progressStatus(reviews[card.id])==='known').length};}
export const dayKey=date=>`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
export function activity(events,now=new Date()){
 const today=dayKey(now);
 // This calendar week, Monday on the left; days still to come stay empty.
 const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(now.getDay()+6)%7);
 const week=Array.from({length:7},(_,index)=>{const date=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+index);return {date,label:date.toLocaleDateString('nl-NL',{weekday:'short'}),count:events.filter(event=>dayKey(new Date(event.at))===dayKey(date)).length};});
 return {today:events.filter(event=>dayKey(new Date(event.at))===today).length,week};
}
export function resumeTheme(events){for(const event of [...events].reverse()){const card=cards.find(card=>card.id===event.cardId);if(themes.some(theme=>theme.id===card?.themeId))return card.themeId;}return 'werk';}
export function planSession(reviews,{theme='all',type='all',now=new Date(),limit=20,cardIds=null}={}){
 let pool=type==='woorden'?vocabulary:type==='praktisch'?phrases:type==='zinnen'?cards.filter(card=>card.themeId==='zinsbouw'):cards;
 pool=pool.filter(card=>theme==='all'||card.themeId===theme);
 if(cardIds){const selected=new Set(cardIds);pool=pool.filter(card=>selected.has(card.id));}
 if(type==='all'){
  const words=pool.filter(card=>!card.id.startsWith('phrase:')),practical=pool.filter(card=>card.id.startsWith('phrase:'));pool=[];
  for(let i=0;i<Math.max(words.length,practical.length);i++){if(words[i])pool.push(words[i]);if(practical[i])pool.push(practical[i]);}
 }
 return makeQueue(pool,reviews,{theme,now,limit});
}

// A mission on Vandaag starts the round that completes it: old cards, new cards (from the theme you are on), or practical sentences.
// "Old" means first practised before today (the same rule dailyMissions counts with), so a round of old cards always counts.
export function missionRound(id,reviews,{theme='all',now=new Date(),limit=5,events=[]}={}){
 const oldest=list=>list.filter(card=>reviews[card.id]).sort((a,b)=>new Date(reviews[a.id].lastReviewed)-new Date(reviews[b.id].lastReviewed));
 if(id==='zinnen'){const queue=planSession(reviews,{type:'praktisch',now,limit});return queue.length?queue:oldest(phrases).slice(0,limit);}
 if(id==='nieuw'){const fresh=cards.filter(card=>!reviews[card.id]);return [...fresh.filter(card=>card.themeId===theme),...fresh.filter(card=>card.themeId!==theme)].slice(0,limit);}
 return oldCards(reviews,events,now).slice(0,limit);
}
/** Cards first practised before today: the ones that are due first, then the ones practised longest ago. Empty for someone who started today. */
export function oldCards(reviews,events,now=new Date()){
 const today=dayKey(now),first=new Map();
 for(const event of events)if(!first.has(event.cardId))first.set(event.cardId,dayKey(new Date(event.at)));
 const old=card=>{const review=reviews[card.id];if(!review)return false;const day=first.get(card.id)??dayKey(new Date(review.lastReviewed));return day!==today;};
 const list=cards.filter(old);
 const due=list.filter(card=>new Date(reviews[card.id].due)<=now).sort((a,b)=>new Date(reviews[a.id].due)-new Date(reviews[b.id].due));
 const rest=list.filter(card=>!due.includes(card)).sort((a,b)=>new Date(reviews[a.id].lastReviewed)-new Date(reviews[b.id].lastReviewed));
 return [...due,...rest];
}
