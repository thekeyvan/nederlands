// Practice modes. Each answer maps onto the existing SM-2 grades:
// right first time = 4 (Goed), right with a hint or small slip = 3 (Moeilijk), wrong = 1 (Nog niet).
// The flashcard mode keeps the learner's own four ratings, including 5 (Makkelijk).
import {audioUrl} from './audio-playback.js';

export const cardKind=card=>card.id.startsWith('zin:')?'grammar':card.id.startsWith('phrase:')?'phrase':'word';

// Deterministic randomness keeps a card's options stable while it is on screen and in tests.
export function seededRandom(seedText){
 let seed=0;for(const char of String(seedText))seed=Math.imul(31,seed)+char.charCodeAt(0)|0;
 return ()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
export function shuffle(list,random=Math.random){
 const result=[...list];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}

const hasAudio=text=>Boolean(text&&audioUrl(text,'ronnie'));

// New cards get recognition modes; cards you know well get recall (typing).
export function chooseMode(card,review,position=0){
 const kind=cardKind(card);
 const repetitions=review?.repetitions||0;
 if(kind==='grammar')return card.prompt?.includes('___')&&card.answer?'gap':'flash';
 if(kind==='phrase'){
  if(repetitions>=2)return 'flash';
  return hasAudio(card.nl)?'listen':'flash';
 }
 if(!card.meaning)return 'flash';
 if(!review)return 'choose';
 if(repetitions<2)return position%2===0&&hasAudio(card.nl)?'listen':'reverse';
 return 'type';
}

// Four options: the right one plus distractors from the same theme first, then the same kind.
export function buildOptions(card,pool,field,{count=4,seed=card.id}={}){
 const random=seededRandom(`${seed}:${field}`);
 const value=item=>(item[field]||'').trim();
 const answer=value(card);
 const seen=new Set([answer.toLocaleLowerCase('nl')]);
 const candidates=pool.filter(item=>item.id!==card.id&&value(item));
 const ranked=[
  ...shuffle(candidates.filter(item=>item.themeId===card.themeId&&item.kind===card.kind),random),
  ...shuffle(candidates.filter(item=>item.themeId===card.themeId&&item.kind!==card.kind),random),
  ...shuffle(candidates.filter(item=>item.themeId!==card.themeId&&item.kind===card.kind),random),
  ...shuffle(candidates.filter(item=>item.themeId!==card.themeId&&item.kind!==card.kind),random)
 ];
 const distractors=[];
 for(const item of ranked){
  const key=value(item).toLocaleLowerCase('nl');
  if(seen.has(key))continue;
  seen.add(key);distractors.push({id:item.id,label:value(item),correct:false});
  if(distractors.length===count-1)break;
 }
 return shuffle([{id:card.id,label:answer,correct:true},...distractors],random);
}

export function normalizeAnswer(text){
 return String(text||'').toLocaleLowerCase('nl').normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[.,!?;:"“”'’()]/g,'').replace(/\s+/g,' ').trim();
}

export function editDistance(a,b){
 const row=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  let previous=row[0];row[0]=i;
  for(let j=1;j<=b.length;j++){const current=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]===b[j-1]?0:1));previous=current;}
 }
 return row[b.length];
}

const article=/^(de|het|een) /;
// 'close' covers a missing article or a small typo: right idea, worth a second look.
export function checkTyped(input,answer){
 const given=normalizeAnswer(input),expected=normalizeAnswer(answer);
 if(!given)return {result:'wrong'};
 if(given===expected)return {result:'correct'};
 if(article.test(expected)&&given===expected.replace(article,''))return {result:'close',hint:'article'};
 if(article.test(expected)&&article.test(given)&&given.replace(article,'')===expected.replace(article,''))return {result:'close',hint:'article'};
 const allowed=expected.length>=10?2:expected.length>=5?1:0;
 if(allowed&&editDistance(given,expected)<=allowed)return {result:'close',hint:'typo'};
 return {result:'wrong'};
}

export function gradeAnswer(result,{hinted=false}={}){
 if(result==='correct')return hinted?3:4;
 if(result==='close')return 3;
 return 1;
}

// Pick distinct word/meaning pairs for the bonus game after a round.
export function pairsFrom(cards,pool,{count=5,seed='pairs'}={}){
 const random=seededRandom(seed);
 const words=[...cards,...shuffle(pool,random)].filter(card=>cardKind(card)==='word'&&card.meaning);
 const chosen=[],meanings=new Set(),dutch=new Set();
 for(const card of words){
  if(chosen.some(item=>item.id===card.id)||meanings.has(card.meaning)||dutch.has(card.nl))continue;
  chosen.push(card);meanings.add(card.meaning);dutch.add(card.nl);
  if(chosen.length===count)break;
 }
 return chosen;
}
