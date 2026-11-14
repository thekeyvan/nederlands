// The game layer. Every number is derived from real review data; nothing is stored separately.
import {courseLessons} from '../../content/course.js';
import {themes} from './learning-data.js';
import {cards,dayKey,themeStats} from './learning-model.js';
import {progressStatus} from './srs.js';

export {courseLessons};

export const XP_CORRECT=10;
export const XP_ATTEMPT=5;
export const xpForGrade=grade=>grade>=3?XP_CORRECT:XP_ATTEMPT;

// Playful names, deliberately not language levels (A2/B1) or proficiency claims.
export const levels=[
 {name:'Toerist',xp:0},
 {name:'Nieuwkomer',xp:100},
 {name:'Buurtbewoner',xp:300},
 {name:'Fietser',xp:600},
 {name:'Collega',xp:1000},
 {name:'Kletskous',xp:1600},
 {name:'Grachtenkenner',xp:2500},
 {name:'Polderkampioen',xp:4000}
];

// Attempts come from per-card review counts, which are never truncated. Misses come from
// the event log (capped locally), so XP can only grow when old events are trimmed.
export function totalXp(reviews,events){
 const attempts=Object.values(reviews).reduce((sum,review)=>sum+(Number.isInteger(review.reviews)?review.reviews:0),0);
 const misses=events.filter(event=>event.grade<3).length;
 return Math.max(0,attempts*XP_CORRECT-misses*(XP_CORRECT-XP_ATTEMPT));
}

export function levelFor(xp){
 let index=0;
 for(let i=0;i<levels.length;i++)if(xp>=levels[i].xp)index=i;
 const current=levels[index],next=levels[index+1]||null;
 const span=next?next.xp-current.xp:1;
 return {index,number:index+1,name:current.name,floor:current.xp,next,toNext:next?next.xp-xp:0,progress:next?Math.min(1,(xp-current.xp)/span):1};
}

const midnight=date=>new Date(date.getFullYear(),date.getMonth(),date.getDate());
const previousDay=date=>{const day=new Date(date);day.setDate(day.getDate()-1);return day;};

export function practiceDays(events){return new Set(events.map(event=>dayKey(new Date(event.at))));}

// A streak survives until the end of today: yesterday's practice still counts while today is open.
export function streak(events,now=new Date()){
 const days=practiceDays(events);
 let cursor=midnight(now);
 const today=days.has(dayKey(cursor));
 if(!today)cursor=previousDay(cursor);
 let count=0;
 while(days.has(dayKey(cursor))){count++;cursor=previousDay(cursor);}
 return {count,today,atRisk:!today&&count>0};
}

export function bestStreak(events){
 const days=practiceDays(events);let best=0;
 for(const event of events){
  const day=midnight(new Date(event.at));
  if(days.has(dayKey(previousDay(day))))continue; // Only count from the first day of a run.
  let run=0,cursor=day;
  while(days.has(dayKey(cursor))){run++;cursor=new Date(cursor.getFullYear(),cursor.getMonth(),cursor.getDate()+1);}
  best=Math.max(best,run);
 }
 return best;
}

// 1 star: half the theme practised. 2 stars: everything practised. 3 stars: 80% well remembered.
export function themeStars({total,done,known}){
 if(!total)return 0;
 if(known/total>=0.8)return 3;
 if(done>=total)return 2;
 if(done/total>=0.5)return 1;
 return 0;
}

export function routeProgress(reviews){
 const steps=courseLessons.map((lesson,index)=>{
  const done=lesson.cardIds.filter(id=>reviews[id]).length;
  const known=lesson.cardIds.filter(id=>progressStatus(reviews[id])==='known').length;
  return {lesson,index,done,known,total:lesson.cardIds.length,complete:done===lesson.cardIds.length};
 });
 const firstOpen=steps.findIndex(step=>!step.complete);
 return {steps,current:firstOpen===-1?steps.length-1:firstOpen,completed:steps.filter(step=>step.complete).length,finished:firstOpen===-1};
}

export const stamps=[
 {id:'fiets',title:'Op de fiets',description:'Je eerste 10 kaartjes geoefend.',test:stats=>stats.attempts>=10},
 {id:'tulp',title:'Eerste tulp',description:'Een thema met minstens één ster.',test:stats=>stats.starredThemes>=1},
 {id:'vuur',title:'Week vol vuur',description:'7 dagen op rij geoefend.',test:stats=>stats.bestStreak>=7},
 {id:'molen',title:'De molen draait',description:'100 verschillende kaartjes geoefend.',test:stats=>stats.practisedCards>=100},
 {id:'stroopwafel',title:'Zoete herinnering',description:'50 kaartjes goed onthouden.',test:stats=>stats.knownCards>=50},
 {id:'kroon',title:'Route voltooid',description:'Alle 8 haltes van de route geoefend.',test:stats=>stats.routeFinished}
];

// Daily missions are counted from today's review events.
export function dailyMissions(events,now=new Date()){
 const today=dayKey(now),first=new Map();
 for(const event of events)if(!first.has(event.cardId))first.set(event.cardId,dayKey(new Date(event.at)));
 const todays=events.filter(event=>dayKey(new Date(event.at))===today);
 const ids=list=>new Set(list.map(event=>event.cardId)).size;
 const review=ids(todays.filter(event=>first.get(event.cardId)!==today));
 const fresh=ids(todays.filter(event=>first.get(event.cardId)===today));
 const practical=todays.filter(event=>event.cardId.startsWith('phrase:')).length;
 return [
  {id:'herhaal',title:'Herhaal 3 oude kaartjes',icon:'rotate',count:Math.min(review,3),target:3},
  {id:'nieuw',title:'Leer 3 nieuwe kaartjes',icon:'sparkles',count:Math.min(fresh,3),target:3},
  {id:'zinnen',title:'Oefen 3 handige zinnen',icon:'message',count:Math.min(practical,3),target:3}
 ].map(mission=>({...mission,done:mission.count>=mission.target}));
}

export function gameStats(reviews,events,now=new Date()){
 const xp=totalXp(reviews,events);
 const attempts=Object.values(reviews).reduce((sum,review)=>sum+(review.reviews||0),0);
 const statuses=Object.values(reviews).map(progressStatus);
 const route=routeProgress(reviews);
 const themeList=themes.map(theme=>{const stats=themeStats(theme.id,reviews);return {theme,stats,stars:themeStars(stats)};});
 const summary={
  xp,level:levelFor(xp),streak:streak(events,now),bestStreak:bestStreak(events),attempts,
  practisedCards:Object.keys(reviews).filter(id=>cards.some(card=>card.id===id)).length,
  knownCards:statuses.filter(status=>status==='known').length,
  learningCards:statuses.filter(status=>status==='learning').length,
  dueCards:Object.values(reviews).filter(review=>new Date(review.due)<=now).length,
  starredThemes:themeList.filter(item=>item.stars>0).length,
  themes:themeList,route,routeFinished:route.finished
 };
 return {...summary,earned:stamps.filter(stamp=>stamp.test(summary)).map(stamp=>stamp.id)};
}
