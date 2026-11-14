import {themes,vocabulary} from './learning-data.js';
import {phrases} from './phrase-data.js';
import {sentences} from './sentence-data.js';
import {makeQueue,progressStatus} from './srs.js';
export const cards=[...vocabulary,...phrases,...sentences.map(card=>({...card,themeId:'zinsbouw'}))];
const categoryMap={werk:['werk','overleg','loopbaan','beroepen'],dagelijks:['wonen','huis-kopen','gezondheid','geld','huisarts','apotheek','gemeente'],vrijetijd:['vrijetijd','cultuur','reizen','natuur','uitgaan'],taal:['contact','mening','tijd','modalen']};
export const groupNames={werk:'Werk & samenwerken',dagelijks:'Elke dag',vrijetijd:'Vrije tijd & onderweg',taal:'Taal & contact'};
const icons={werk:'briefcase-business',overleg:'users',loopbaan:'building-2',beroepen:'briefcase-business',wonen:'house','huis-kopen':'key-round',vrijetijd:'bike',cultuur:'music',reizen:'train-front',natuur:'trees',uitgaan:'utensils',contact:'message-circle',mening:'scale',tijd:'clock',gezondheid:'heart-handshake',geld:'wallet',modalen:'message-circle',huisarts:'stethoscope',apotheek:'pill',gemeente:'landmark'};
export function themeMeta(theme){const group=Object.keys(categoryMap).find(key=>categoryMap[key].includes(theme.id)) || 'dagelijks';return {icon:icons[theme.id] || 'book-open',group,label:groupNames[group],color:group==='werk'?'lavender':group==='vrijetijd'?'mint':group==='taal'?'blue':'peach'};}
export function themeStats(id,reviews){const list=cards.filter(card=>card.themeId===id);return {total:list.length,done:list.filter(card=>reviews[card.id]).length,known:list.filter(card=>progressStatus(reviews[card.id])==='known').length};}
export const dayKey=date=>`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
export function activity(events,now=new Date()){
 const today=dayKey(now);const week=Array.from({length:7},(_,index)=>{const date=new Date(now);date.setDate(date.getDate()-6+index);return {date,label:date.toLocaleDateString('nl-NL',{weekday:'short'}),count:events.filter(event=>dayKey(new Date(event.at))===dayKey(date)).length};});
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
