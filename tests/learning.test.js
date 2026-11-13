import test from 'node:test';
import assert from 'node:assert/strict';
import {themes,vocabulary,searchVocabulary} from '../learning-data.js';
import {sentences} from '../sentence-data.js';
import {scheduleReview,makeQueue,mergeReviews,progressStatus,validReviews} from '../srs.js';
const now=new Date('2026-11-13T10:00:00Z');
test('learning content has stable unique IDs and Persian meanings',()=>{
 const cards=[...vocabulary,...sentences];assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
 assert.ok(themes.length>=16);assert.ok(vocabulary.length>=400);assert.ok(sentences.length>=25);
 for(const w of vocabulary){assert.match(w.meaning,/[\u0600-\u06ff]/);assert.ok(['woord','werkwoord','uitdrukking'].includes(w.kind));if(w.kind==='werkwoord')assert.equal(w.forms?.length,3,w.nl);}
 for(const s of sentences){assert.ok(s.prompt.includes('___'));assert.ok(s.answer);assert.match(s.rule,/[\u0600-\u06ff]/);}
 assert.ok(searchVocabulary('پرده').some(w=>w.nl==='de gordijnen'));
 assert.ok(searchVocabulary('OVERLEGGEN').some(w=>w.nl==='overleggen'));
 assert.equal(searchVocabulary('not-a-word-zq').length,0);
});
test('SM-2 uses 1, 6 and multiplicative intervals and resets on failure',()=>{
 let r=scheduleReview({},4,now);assert.equal(r.interval,1);assert.equal(r.ease,2.5);assert.equal(r.repetitions,1);
 r=scheduleReview(r,4,now);assert.equal(r.interval,6);r=scheduleReview(r,4,now);assert.equal(r.interval,15);assert.equal(progressStatus(r),'known');
 r=scheduleReview(r,1,now);assert.equal(r.interval,1);assert.equal(r.repetitions,0);assert.equal(progressStatus(r),'learning');
 for(let i=0;i<20;i++)r=scheduleReview(r,1,now);assert.equal(r.ease,1.3);
 assert.throws(()=>scheduleReview({},9,now),RangeError);
});
test('review queue prioritizes overdue cards and limits new cards',()=>{
 const cards=Array.from({length:20},(_,i)=>({id:String(i),themeId:i<10?'a':'b'}));
 const reviews={'0':{due:'2026-11-12'},'1':{due:'2026-11-10'},'2':{due:'2026-12-01'}};
 const q=makeQueue(cards,reviews,{now});assert.deepEqual(q.slice(0,2).map(c=>c.id),['1','0']);assert.equal(q.length,7);assert.ok(!q.some(c=>c.id==='2'));
 assert.ok(makeQueue(cards,reviews,{now,theme:'b'}).every(c=>c.themeId==='b'));
});
test('offline merge preserves the newest review and rejects corrupt state',()=>{
 const a=scheduleReview({},4,new Date('2026-11-11'));const b=scheduleReview(a,3,now);
 assert.deepEqual(mergeReviews({a:b},{a:a}).a,b);assert.deepEqual(mergeReviews({a:a},{a:b}).a,b);
 assert.deepEqual(validReviews({a:b,b:b,c:{}},new Set(['a','c'])),{a:b});
 assert.deepEqual(validReviews(null,new Set()),{});
});
