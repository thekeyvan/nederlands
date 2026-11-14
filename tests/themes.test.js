import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {baseThemes} from '../content/themes.js';
import {baseVocabulary} from '../content/words.js';
import {baseSentences} from '../content/grammar.js';
import {basePhrases} from '../content/phrases.js';
import {baseDialogues} from '../content/dialogues.js';
import {locales} from '../locales/index.js';
import {translateCard} from '../src/core/i18n.js';
import {makeQueue,validReviews,scheduleReview} from '../src/core/srs.js';
const cards=[...baseVocabulary,...baseSentences,...basePhrases];
const ids=new Set(cards.map(card=>card.id));
test('every theme has practical sentences and a coherent dialogue structure',()=>{
 assert.equal(ids.size,cards.length);
 const themes=new Set(baseThemes.map(theme=>theme.id));assert.equal(themes.size,baseThemes.length);
 for(const theme of themes){assert.ok(baseVocabulary.some(card=>card.themeId===theme));assert.ok(basePhrases.filter(card=>card.themeId===theme).length>=5);const dialogue=baseDialogues.find(item=>item.themeId===theme);assert.ok(dialogue?.lines.length>=4);for(const line of dialogue.lines){assert.ok(line.speaker);assert.ok(line.nl);}}
 for(const phrase of basePhrases){assert.ok(themes.has(phrase.themeId));assert.ok(['A2','B1'].includes(phrase.level));}
 const lines=baseDialogues.flatMap(item=>item.lines);assert.equal(new Set(lines.map(line=>line.id)).size,lines.length);
 assert.ok(themes.has('huisarts'));assert.ok(themes.has('apotheek'));assert.ok(themes.has('gemeente'));
});
test('registered packs cover all meanings, explanations, dialogue lines and hints',()=>{
 const requiredUI=Object.keys(locales.fa.ui);
 for(const [code,pack] of Object.entries(locales)){
  assert.equal(pack.code,code);assert.ok(['ltr','rtl'].includes(pack.dir));assert.ok(pack.name&&pack.dutchName&&pack.font);
  for(const theme of baseThemes)assert.ok(pack.themes[theme.id]?.trim(),`${code}: ${theme.id}`);
  for(const card of cards){const text=pack.cards[card.id];assert.ok(text,`${code}: ${card.id}`);if(card.id.startsWith('zin:')){for(const key of ['rule','translation','note'])assert.ok(text[key]?.trim(),`${code}: ${card.id}.${key}`);}else{assert.ok(text.meaning?.trim(),`${code}: ${card.id}`);if(card.example)assert.ok(text.translation?.trim(),`${code}: ${card.id}.translation`);}}
  for(const line of baseDialogues.flatMap(item=>item.lines))assert.ok(pack.dialogues[line.id]?.trim(),`${code}: ${line.id}`);
  for(const key of requiredUI)assert.ok(pack.ui[key]?.trim(),`${code}: ${key}`);
 }
 assert.doesNotMatch(JSON.stringify([baseThemes,cards,baseDialogues]),/[\u0600-\u06ff]/);
});
test('new translation packs override text without changing IDs or inheriting Persian',()=>{
 const card=basePhrases[0],pack={cards:{[card.id]:{meaning:'Trabajo dos días desde casa.'}}};
 assert.equal(translateCard(card,pack).meaning,'Trabajo dos días desde casa.');assert.equal(translateCard(card,pack).id,card.id);
 assert.equal(translateCard(card,{cards:{}}).meaning,undefined);
});
test('the original 500 card IDs survive, and practical sentences use the same scheduler',async()=>{
 const baseline=JSON.parse(await readFile(new URL('./fixtures/original-card-ids.json',import.meta.url)));
 for(const id of baseline)assert.ok(ids.has(id),`Existing progress would be lost: ${id}`);
 const now=new Date('2026-11-13T12:00:00Z'),card=basePhrases.find(card=>card.themeId==='huisarts'),review=scheduleReview({},4,now);
 assert.deepEqual(validReviews({[card.id]:review},ids),{[card.id]:review});
 assert.ok(makeQueue(basePhrases,{}, {theme:'huisarts',now}).every(card=>card.themeId==='huisarts'));
 assert.equal(makeQueue(basePhrases,{[card.id]:review},{theme:'huisarts',now}).some(item=>item.id===card.id),false);
});

test('every word has a Dutch usage example and its translated example',()=>{
 for(const card of baseVocabulary){assert.ok(card.example?.trim(),card.id);assert.doesNotMatch(card.example,/[\u0600-\u06ff]/);for(const pack of Object.values(locales))assert.ok(pack.cards[card.id].translation?.trim(),`${pack.code}: ${card.id}`);}
});
