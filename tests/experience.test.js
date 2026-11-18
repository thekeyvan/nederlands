import test from 'node:test';
import assert from 'node:assert/strict';
import {access} from 'node:fs/promises';
import {themes,vocabulary} from '../src/core/learning-data.js';
import {phrases} from '../src/core/phrase-data.js';
import {themeMeta,themeStats,planSession,activity,resumeTheme} from '../src/core/learning-model.js';
import {scheduleReview} from '../src/core/srs.js';
const now=new Date(2026,10,13,12);
test('short mixed sessions stay in the chosen theme and include practical recall',()=>{
 const session=planSession({}, {theme:'huisarts',type:'all',now,limit:5});assert.equal(session.length,5);assert.ok(session.every(card=>card.themeId==='huisarts'));assert.ok(session.some(card=>card.id.startsWith('phrase:')));assert.ok(session.some(card=>!card.id.startsWith('phrase:')));
 const old=vocabulary.find(card=>card.themeId==='huisarts'),recent=phrases.find(card=>card.themeId==='huisarts');
 const reviews={[old.id]:{...scheduleReview({},4,now),due:new Date(2026,10,11).toISOString()},[recent.id]:{...scheduleReview({},4,now),due:new Date(2026,10,12).toISOString()}};
 assert.deepEqual(planSession(reviews,{theme:'huisarts',type:'all',now,limit:5}).slice(0,2).map(card=>card.id),[old.id,recent.id]);
});
test('daily activity is this calendar week from Monday, uses local dates and includes empty days',()=>{
 const reference=new Date(2026,10,13,0,15);const events=[{at:new Date(2026,10,12,23,55).toISOString()},{at:new Date(2026,10,13,0,5).toISOString()}];
 const result=activity(events,reference);assert.equal(result.today,1);assert.equal(result.week.length,7);assert.deepEqual(result.week.map(day=>day.date.getDay()),[1,2,3,4,5,6,0]);assert.equal(result.week[4].count,1);assert.equal(result.week[3].count,1);assert.ok([0,1,2,5,6].every(index=>result.week[index].count===0));
});
test('continuation ignores unrelated history and theme progress includes sentence cards',()=>{
 const phrase=phrases.find(card=>card.themeId==='apotheek');assert.equal(resumeTheme([{cardId:phrase.id},{cardId:'zin:v2'},{cardId:'unknown'}]),'apotheek');assert.equal(resumeTheme([]),'werk');
 const progress=themeStats('apotheek',{[phrase.id]:scheduleReview({},4,now)});assert.equal(progress.done,1);assert.equal(progress.known,0);assert.equal(progress.total,vocabulary.filter(card=>card.themeId==='apotheek').length+phrases.filter(card=>card.themeId==='apotheek').length);
});
test('the bundled topics have shipped illustrations and new topics fall back to an icon',async()=>{
 const bundled=['werk','overleg','loopbaan','beroepen','wonen','huis-kopen','vrijetijd','cultuur','reizen','natuur','uitgaan','contact','mening','tijd','gezondheid','geld','modalen','huisarts','apotheek','gemeente'];
 for(const id of bundled){assert.ok(themes.some(theme=>theme.id===id),id);await access(new URL(`../src/assets/illustrations/themes/${id}.jpg`,import.meta.url));}
 assert.equal(themeMeta({id:'new-fork-theme'}).icon,'book-open');
});
