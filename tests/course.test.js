import test from 'node:test';
import assert from 'node:assert/strict';
import {courseLessons} from '../content/course.js';
import {baseSentences} from '../content/grammar.js';
import {themes} from '../src/core/learning-data.js';
import {cards,planSession} from '../src/core/learning-model.js';
import {scheduleReview} from '../src/core/srs.js';

test('classroom path resolves existing cards and grammar without duplicating progress',()=>{
 assert.equal(courseLessons.length,8);
 assert.equal(new Set(courseLessons.map(lesson=>lesson.id)).size,8);
 for(const lesson of courseLessons){
  assert.ok(lesson.goal&&lesson.task);
  assert.equal(new Set(lesson.cardIds).size,lesson.cardIds.length);
  for(const id of lesson.cardIds)assert.ok(cards.some(card=>card.id===id),id);
  for(const id of lesson.grammarIds){assert.ok(baseSentences.some(card=>card.id===id),id);assert.ok(lesson.cardIds.includes(id));}
  for(const id of lesson.themeIds)assert.ok(themes.some(theme=>theme.id===id),id);
 }
});

test('lesson sessions retain due-first scheduling and exclude cards outside the step',()=>{
 const lesson=courseLessons[0],now=new Date('2026-11-14T12:00:00Z');
 const [dueId,futureId]=lesson.cardIds;
 const due={...scheduleReview({},4,now),due:'2026-11-13T12:00:00Z'};
 const future={...due,due:'2026-12-01T12:00:00Z'};
 const reviews={[dueId]:due,[futureId]:future,'zin:hypothese':due};
 const queue=planSession(reviews,{cardIds:lesson.cardIds,limit:10,now});
 assert.equal(queue[0].id,dueId);
 assert.ok(queue.every(card=>lesson.cardIds.includes(card.id)));
 assert.ok(!queue.some(card=>card.id===futureId));
 assert.ok(queue.length<=6); // One due card and at most five new cards.
 assert.deepEqual(planSession({}, {cardIds:[],now}),[]);
});
