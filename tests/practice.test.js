import test from 'node:test';
import assert from 'node:assert/strict';
import {vocabulary} from '../src/core/learning-data.js';
import {phrases} from '../src/core/phrase-data.js';
import {sentences} from '../src/core/sentence-data.js';
import {scheduleReview} from '../src/core/srs.js';
import {chooseMode,buildOptions,checkTyped,gradeAnswer,normalizeAnswer,editDistance,pairsFrom,cardKind} from '../src/core/practice.js';

const word=vocabulary.find(card=>card.id==='werk:de-balans');
const now=new Date('2026-11-14T12:00:00Z');

test('new cards are recognised first, known cards are recalled by typing',()=>{
 assert.equal(chooseMode(word,undefined),'choose');
 const once=scheduleReview({},4,now);
 assert.ok(['listen','reverse'].includes(chooseMode(word,once,0)));
 assert.equal(chooseMode(word,once,1),'reverse');
 const known=scheduleReview(scheduleReview(once,4,now),4,now);
 assert.equal(chooseMode(word,known),'type');
 assert.equal(chooseMode(phrases[0],undefined),'listen');
 assert.equal(chooseMode(phrases[0],known),'flash');
 assert.equal(chooseMode(sentences[0],undefined),'gap');
 assert.equal(cardKind(sentences[0]),'grammar');
});

test('options contain the answer once, three distinct distractors, and stay stable per card',()=>{
 const options=buildOptions(word,vocabulary,'meaning');
 assert.equal(options.length,4);
 assert.equal(options.filter(option=>option.correct).length,1);
 assert.equal(options.find(option=>option.correct).label,word.meaning);
 assert.equal(new Set(options.map(option=>option.label)).size,4);
 assert.deepEqual(buildOptions(word,vocabulary,'meaning'),options);
 // Distractors prefer the same theme.
 const ids=options.filter(option=>!option.correct).map(option=>option.id);
 assert.ok(ids.every(id=>vocabulary.find(card=>card.id===id).themeId===word.themeId));
 const phrase=phrases[0],spoken=buildOptions(phrase,phrases,'nl');
 assert.equal(spoken.find(option=>option.correct).label,phrase.nl);
});

test('typed answers forgive case, punctuation and accents; articles and small typos count as close',()=>{
 assert.equal(normalizeAnswer('  Tweeënhalf! '),'tweeenhalf');
 assert.deepEqual(checkTyped('De balans','de balans'),{result:'correct'});
 assert.deepEqual(checkTyped('balans','de balans'),{result:'close',hint:'article'});
 assert.deepEqual(checkTyped('het balans','de balans'),{result:'close',hint:'article'});
 assert.deepEqual(checkTyped('de balens','de balans'),{result:'close',hint:'typo'});
 assert.deepEqual(checkTyped('fiets','de balans'),{result:'wrong'});
 assert.deepEqual(checkTyped('',word.nl),{result:'wrong'});
 assert.deepEqual(checkTyped('ben','bent'),{result:'wrong'}); // Short words need to be exact.
 assert.equal(editDistance('kitten','sitting'),3);
});

test('answers map onto the existing SM-2 grades',()=>{
 assert.equal(gradeAnswer('correct'),4);
 assert.equal(gradeAnswer('correct',{hinted:true}),3);
 assert.equal(gradeAnswer('close'),3);
 assert.equal(gradeAnswer('wrong'),1);
 for(const grade of [1,3,4])assert.doesNotThrow(()=>scheduleReview({},grade,now));
});

test('the pairs game uses distinct words and meanings, topping up from the pool',()=>{
 const pairs=pairsFrom([word,phrases[0]],vocabulary,{count:5});
 assert.equal(pairs.length,5);assert.equal(pairs[0].id,word.id);
 assert.equal(new Set(pairs.map(card=>card.meaning)).size,5);
 assert.ok(pairs.every(card=>cardKind(card)==='word'));
});
