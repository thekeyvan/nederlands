// Study games. Pure helpers that turn the existing content into game rounds.
// Games never change the SM-2 schedule; they keep their own personal bests, and missed
// cards can be sent to a normal practice round.
import {buildOptions,checkTyped,normalizeAnswer,seededRandom,shuffle} from './practice.js';

const pick=(list,count,random)=>shuffle(list,random).slice(0,count);
const endPunctuation=/[.?!…]+$/;
const bare=token=>token.replace(/^[„“"'(]+|[.,!?;:…"”')]+$/g,'');
// Small function words often fit a gap grammatically, which would make two answers right.
const functionWords=new Set(['niet','mijn','jouw','onze','jullie','haar','heel','veel','maar','want','omdat','graag','even','meer','weer','toch','zijn','deze','hier','daar','waar','wanneer','welke','welk','nooit','altijd','misschien','eigenlijk','echt','alleen','samen','zeker','morgen','vandaag','gisteren']);

/* De of het? Nouns stored with their article. */
export function articleItems(words){
 return words.filter(word=>/^(de|het) \S/.test(word.nl||'')).map(word=>({card:word,article:word.nl.split(' ')[0],noun:word.nl.slice(word.nl.indexOf(' ')+1)}));
}

/* Zinnen bouwen: put the words in order. The first word is given, which removes most of the
   ambiguity of Dutch word order; the full stop or question mark is shown separately. */
export function builderItem(card,text,seed=card.id){
 const clean=String(text||'').trim();
 const ending=(clean.match(endPunctuation)||[''])[0];
 const tokens=clean.replace(endPunctuation,'').split(/\s+/).filter(Boolean);
 if(tokens.length<4||tokens.length>9)return null;
 const [first,...rest]=tokens;
 const random=seededRandom(`${seed}:builder`);
 let tiles=rest.map((text,index)=>({id:`${index}`,text}));
 for(let attempt=0;attempt<8;attempt++){
  tiles=shuffle(tiles,random);
  if(tiles.map(tile=>tile.text).join(' ')!==rest.join(' '))break;
 }
 return {card,first,answer:rest,tiles,ending,sentence:clean};
}
export const builderCorrect=(item,chosen)=>normalizeAnswer(chosen.join(' '))===normalizeAnswer(item.answer.join(' '));

/* Werkwoorden: choose the right past form. Distractors follow typical learner mistakes:
   hebben/zijn swapped, t and d swapped, ge- added or dropped, or a wrong tense. */
const swapFinal=(word,from,to)=>word.endsWith(from)?word.slice(0,-from.length)+to:null;
// Verbs of movement take hebben (activity) or zijn (destination), so swapping the auxiliary is not a mistake.
const bothAuxiliaries=/(fietsen|lopen|rijden|zwemmen|vliegen|wandelen|varen|rennen|springen|reizen|klimmen|zeilen|schaatsen|roeien|dansen|kruipen)$/;
function participleMistakes(perfect,infinitive='',past=''){
 const [aux,participle]=perfect.split(' ');
 const other=aux==='heb'?'ben':'heb';
 const result=bothAuxiliaries.test(infinitive)?[]:[`${other} ${participle}`];
 const td=swapFinal(participle,'t','d')||swapFinal(participle,'d','t');
 if(td)result.push(`${aux} ${td}`);
 if(participle.startsWith('ge'))result.push(`${aux} ${participle.slice(2)}`);
 else result.push(`${aux} ge${participle}`); // Also teaches that be-, ver-, ont- and her- verbs take no ge-.
 if(past)result.push(`${aux} ${past}`); // Using the past tense instead of the participle.
 return result;
}
function pastMistakes(past,perfect,infinitive){
 const [first,...rest]=past.split(' ');
 const tail=rest.length?` ${rest.join(' ')}`:'';
 const result=[];
 const swapped=swapFinal(first,'te','de')||swapFinal(first,'de','te')||swapFinal(first,'ten','den')||swapFinal(first,'den','ten');
 if(swapped)result.push(swapped+tail);
 result.push(perfect.split(' ')[1]);
 // A regular past by the 't kofschip rule: the typical mistake with strong verbs.
 const stem=infinitive.replace(/en$/,'');
 if(stem!==infinitive)result.push(stem+('tkfschp'.includes(stem.at(-1))?'te':'de'));
 result.push(infinitive);
 return result;
}
export function verbItems(verbs){
 return verbs.filter(verb=>verb.forms?.length===3&&/^(heb|ben) \S+$/.test(verb.forms[1])&&!/[/(]/.test(verb.forms[0])).map(verb=>({card:verb,past:verb.forms[0],perfect:verb.forms[1],note:verb.forms[2]}));
}
export function verbQuestion(item,kind,seed=item.card.id){
 const random=seededRandom(`${seed}:${kind}`);
 const answer=kind==='perfect'?item.perfect:item.past;
 const mistakes=kind==='perfect'?participleMistakes(item.perfect,item.card.nl,item.past):pastMistakes(item.past,item.perfect,item.card.nl);
 const seen=new Set([normalizeAnswer(answer)]),options=[{label:answer,correct:true}];
 for(const label of mistakes){const key=normalizeAnswer(label);if(!label||seen.has(key))continue;seen.add(key);options.push({label,correct:false});if(options.length===4)break;}
 return {item,kind,answer,options:shuffle(options,random)};
}

/* Zinnen aanvullen: a gap in a practical sentence or a grammar pattern. */
export function clozeItem(card,pool,seed=card.id){
 const random=seededRandom(`${seed}:cloze`);
 if(card.prompt?.includes('___')&&card.answer){
  const answers=[...new Set(pool.filter(item=>item.answer&&item.id!==card.id).map(item=>item.answer))];
  const distractors=pick(answers.filter(answer=>normalizeAnswer(answer)!==normalizeAnswer(card.answer)),3,random);
  const [before,after]=card.prompt.split('___');
  // Match capitals to the gap's position, so a capital letter never gives an option away.
  const atStart=!before.trim();
  const fit=word=>atStart?word.charAt(0).toLocaleUpperCase('nl')+word.slice(1):word.charAt(0).toLocaleLowerCase('nl')+word.slice(1);
  return {card,before,after,answer:card.answer,options:shuffle([card.answer,...distractors.map(fit)],random).map(label=>({label,correct:label===card.answer}))};
 }
 const tokens=String(card.nl||'').split(' ');
 const candidates=tokens.map((token,index)=>({index,word:bare(token)})).filter(({index,word})=>index>0&&word.length>=4&&/^[\p{L}-]+$/u.test(word));
 if(!candidates.length)return null;
 const longest=Math.max(...candidates.map(item=>item.word.length));
 const choice=pick(candidates.filter(item=>item.word.length>=Math.min(longest,6)),1,random)[0];
 const token=tokens[choice.index];
 const [lead,trail]=token.split(choice.word);
 const before=tokens.slice(0,choice.index).join(' ')+(choice.index?' ':'')+lead;
 const after=trail+(choice.index<tokens.length-1?' ':'')+tokens.slice(choice.index+1).join(' ');
 const answer=choice.word;
 const words=[...new Set(pool.filter(item=>item.id!==card.id&&item.nl).flatMap(item=>item.nl.split(' ').map(bare)))]
  .filter(word=>word.length>=5&&!functionWords.has(word.toLocaleLowerCase('nl'))&&/^[\p{L}-]+$/u.test(word)&&normalizeAnswer(word)!==normalizeAnswer(answer)&&Math.abs(word.length-answer.length)<=3);
 const distractors=pick(words,3,random);
 if(distractors.length<3)return null;
 return {card,before,after,answer,options:shuffle([answer,...distractors],random).map(label=>({label,correct:label===answer}))};
}

/* Gesprekken: at each of your turns, pick what you would say. */
export function dialogueSteps(dialogue,dialogues,seed=dialogue.id){
 const random=seededRandom(`${seed}:dialogue`);
 const others=dialogues.filter(item=>item.id!==dialogue.id).flatMap(item=>item.lines.filter(line=>line.speaker==='Jij'));
 return dialogue.lines.map(line=>line.speaker!=='Jij'?{line,options:null}:{line,options:shuffle([{line,correct:true},...pick(others,2,random).map(other=>({line:other,correct:false}))],random)});
}

/* Luisterdictee: short items you can type after hearing them once or twice. */
export const dictationItems=cards=>cards.filter(card=>card.nl&&card.nl.split(' ').length<=8);
export const checkDictation=(input,card)=>checkTyped(input,card.nl);

/* Tijdrace: endless translation questions. */
export const raceQuestion=(card,pool,seed)=>({card,options:buildOptions(card,pool,'meaning',{seed})});

/* Personal bests, kept in this browser. */
export function recordScore(records,id,score,now=new Date()){
 const previous=records[id]||{best:0,played:0};
 const isBest=score>previous.best;
 return {records:{...records,[id]:{best:Math.max(previous.best,score),played:previous.played+1,last:now.toISOString()}},isBest,previousBest:previous.best};
}
export function validRecords(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {};
 return Object.fromEntries(Object.entries(input).filter(([id,value])=>/^[a-z-]{2,20}$/.test(id)&&value&&Number.isInteger(value.best)&&value.best>=0&&Number.isInteger(value.played)&&value.played>=0));
}

/* Pick round items, falling back to all content when a theme has too few. */
export function roundPool(all,themeId,minimum){
 if(themeId==='all')return {items:all,narrowed:false};
 const themed=all.filter(item=>(item.card?.themeId??item.themeId)===themeId);
 return themed.length>=minimum?{items:themed,narrowed:true}:{items:all,narrowed:false};
}
export {pick};
