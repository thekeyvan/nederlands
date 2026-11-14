import test from 'node:test';
import assert from 'node:assert/strict';
import {vocabulary} from '../src/core/learning-data.js';
import {phrases,dialogues} from '../src/core/phrase-data.js';
import {sentences} from '../src/core/sentence-data.js';
import {articleItems,builderItem,builderCorrect,verbItems,verbQuestion,clozeItem,dialogueSteps,dictationItems,checkDictation,raceQuestion,recordScore,validRecords,roundPool} from '../src/core/games.js';

test('de/het items split the article from the noun',()=>{
 const items=articleItems(vocabulary);
 assert.ok(items.length>=250);
 assert.ok(items.every(item=>['de','het'].includes(item.article)&&item.noun&&!/^(de|het) /.test(item.noun)));
 assert.ok(items.some(item=>item.article==='het'));
});

test('sentence builder gives the first word, shuffles the rest and keeps the ending apart',()=>{
 const card={id:'phrase:x',nl:'Ik werk twee dagen per week thuis.'};
 const item=builderItem(card,card.nl);
 assert.equal(item.first,'Ik');assert.equal(item.ending,'.');
 assert.deepEqual(item.answer,['werk','twee','dagen','per','week','thuis']);
 assert.notDeepEqual(item.tiles.map(tile=>tile.text),item.answer);
 assert.deepEqual([...item.tiles.map(tile=>tile.text)].sort(),[...item.answer].sort());
 assert.ok(builderCorrect(item,item.answer));
 assert.ok(!builderCorrect(item,[...item.answer].reverse()));
 assert.equal(builderItem(card,'Te kort.'),null);
 const usable=phrases.map(phrase=>builderItem(phrase,phrase.nl)).filter(Boolean);
 assert.ok(usable.length>=60);
});

test('verb questions offer the right form once and realistic mistakes',()=>{
 const items=verbItems(vocabulary);
 assert.ok(items.length>=90);
 for(const item of items.slice(0,60))for(const kind of ['perfect','past']){
  const question=verbQuestion(item,kind);
  assert.ok(question.options.length>=3,`${item.card.nl} ${kind}`);
  assert.equal(question.options.filter(option=>option.correct).length,1);
  assert.equal(new Set(question.options.map(option=>option.label)).size,question.options.length);
 }
 const work=items.find(item=>item.card.nl==='thuiswerken');
 const labels=verbQuestion(work,'perfect').options.map(option=>option.label);
 assert.ok(labels.includes('heb thuisgewerkt')&&labels.includes('ben thuisgewerkt'));
});

test('movement verbs never present the other auxiliary as wrong',()=>{
 const fake={card:{id:'x:fietsen',nl:'fietsen'},past:'fietste',perfect:'heb gefietst',note:'regelmatig'};
 assert.ok(!verbQuestion(fake,'perfect').options.some(option=>option.label==='ben gefietst'));
});

test('cloze questions blank one word and offer distinct options',()=>{
 const items=phrases.map(card=>clozeItem(card,phrases)).filter(Boolean);
 assert.ok(items.length>=80);
 for(const item of items){
  assert.equal(`${item.before}${item.answer}${item.after}`,item.card.nl);
  assert.equal(item.options.filter(option=>option.correct).length,1);
  assert.equal(new Set(item.options.map(option=>option.label.toLowerCase())).size,4);
 }
 const grammar=clozeItem(sentences[0],sentences);
 assert.equal(grammar.answer,sentences[0].answer);assert.equal(grammar.options.length,4);
});

test('dialogue steps ask only at your turns, with replies from other conversations',()=>{
 const steps=dialogueSteps(dialogues[0],dialogues);
 assert.equal(steps.length,dialogues[0].lines.length);
 for(const step of steps){
  if(step.line.speaker!=='Jij'){assert.equal(step.options,null);continue;}
  assert.equal(step.options.length,3);
  assert.equal(step.options.filter(option=>option.correct).length,1);
  assert.ok(step.options.filter(option=>!option.correct).every(option=>!dialogues[0].lines.includes(option.line)));
 }
});

test('dictation forgives small slips and race questions reuse the four options',()=>{
 const items=dictationItems(phrases);assert.ok(items.length>=80);
 assert.equal(checkDictation('ik werk twee dagen per week thuis',{nl:'Ik werk twee dagen per week thuis.'}).result,'correct');
 assert.equal(checkDictation('Ik werk twee dagen per weel thuis.',{nl:'Ik werk twee dagen per week thuis.'}).result,'close');
 const question=raceQuestion(vocabulary[0],vocabulary,'race-1');
 assert.equal(question.options.length,4);
});

test('personal bests only go up and damaged records are ignored',()=>{
 let state=recordScore({},'lidwoord',12);assert.equal(state.isBest,true);assert.equal(state.records.lidwoord.best,12);
 state=recordScore(state.records,'lidwoord',8);assert.equal(state.isBest,false);assert.equal(state.records.lidwoord.best,12);assert.equal(state.records.lidwoord.played,2);
 assert.deepEqual(validRecords({ok:{best:3,played:1},bad:{best:-1,played:1},'../x':{best:1,played:1}}),{ok:{best:3,played:1}});
 assert.deepEqual(validRecords(null),{});
});

test('theme rounds fall back to all content when a theme is too small',()=>{
 const all=articleItems(vocabulary);
 assert.equal(roundPool(all,'all',10).narrowed,false);
 const themed=roundPool(all,'werk',5);assert.ok(themed.narrowed);assert.ok(themed.items.every(item=>item.card.themeId==='werk'));
 assert.equal(roundPool(all,'werk',9999).narrowed,false);
});
