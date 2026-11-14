import test from 'node:test';
import assert from 'node:assert/strict';
import {vocabulary} from '../src/core/learning-data.js';
import {scheduleReview} from '../src/core/srs.js';
import {totalXp,levelFor,levels,streak,bestStreak,themeStars,routeProgress,courseLessons,dailyMissions,gameStats,stamps} from '../src/core/game.js';

const at=(y,m,d,h=12)=>new Date(y,m,d,h).toISOString();
const event=(cardId,grade,date)=>({id:`${cardId}:${date}`,cardId,grade,at:date});

test('XP rewards every attempt, correct answers more, and never shrinks when old events are trimmed',()=>{
 const card=vocabulary[0].id,other=vocabulary[1].id;
 let review=scheduleReview({},4,new Date());review=scheduleReview(review,1,new Date());
 const reviews={[card]:review,[other]:scheduleReview({},5,new Date())};
 const events=[event(card,4,at(2026,10,1)),event(card,1,at(2026,10,2)),event(other,5,at(2026,10,2))];
 assert.equal(totalXp(reviews,events),25);
 assert.ok(totalXp(reviews,events.slice(2))>=totalXp(reviews,events));
 assert.equal(totalXp({},[]),0);
});

test('levels use fun names with increasing thresholds and report progress to the next level',()=>{
 assert.deepEqual(levels.map(level=>level.xp),[...levels.map(level=>level.xp)].sort((a,b)=>a-b));
 assert.equal(levelFor(0).name,'Toerist');
 const mid=levelFor(340);assert.equal(mid.name,'Buurtbewoner');assert.equal(mid.number,3);assert.equal(mid.toNext,260);assert.ok(mid.progress>0.1&&mid.progress<0.2);
 const top=levelFor(99999);assert.equal(top.next,null);assert.equal(top.progress,1);
 assert.ok(!levels.some(level=>/A1|A2|B1|B2|C1/.test(level.name)));
});

test('streaks count local calendar days and survive until today ends',()=>{
 const now=new Date(2026,10,14,9);
 const days=[10,11,12,13].map(d=>event('x',4,at(2026,10,d)));
 assert.deepEqual(streak(days,now),{count:4,today:false,atRisk:true});
 assert.deepEqual(streak([...days,event('x',4,at(2026,10,14,8))],now),{count:5,today:true,atRisk:false});
 assert.equal(streak([event('x',4,at(2026,10,11))],now).count,0);
 assert.equal(streak([],now).count,0);
 // Late evening and just after midnight are two different days.
 assert.equal(streak([event('x',4,new Date(2026,10,13,23,55).toISOString()),event('x',4,new Date(2026,10,14,0,5).toISOString())],now).count,2);
});

test('best streak finds the longest run, including across a month boundary',()=>{
 const run=[29,30,31].map(d=>event('x',4,at(2026,9,d))).concat([1,2].map(d=>event('x',4,at(2026,10,d))));
 assert.equal(bestStreak([...run,event('x',4,at(2026,10,9))]),5);
 assert.equal(bestStreak([]),0);
});

test('theme stars reward half, all, then well remembered',()=>{
 assert.equal(themeStars({total:0,done:0,known:0}),0);
 assert.equal(themeStars({total:10,done:4,known:0}),0);
 assert.equal(themeStars({total:10,done:5,known:0}),1);
 assert.equal(themeStars({total:10,done:10,known:2}),2);
 assert.equal(themeStars({total:10,done:10,known:8}),3);
});

test('the route follows the classroom steps and points at the first unfinished stop',()=>{
 assert.equal(routeProgress({}).current,0);
 const first=Object.fromEntries(courseLessons[0].cardIds.map(id=>[id,scheduleReview({},4,new Date())]));
 const route=routeProgress(first);
 assert.equal(route.steps[0].complete,true);assert.equal(route.current,1);assert.equal(route.completed,1);assert.equal(route.finished,false);
});

test('daily missions count only today, separating new and older cards',()=>{
 const now=new Date(2026,10,14,15);const [a,b]=vocabulary;
 const events=[event(a.id,4,at(2026,10,10)),event(a.id,4,at(2026,10,14,9)),event(b.id,3,at(2026,10,14,10)),event('phrase:werk:01',4,at(2026,10,14,11))];
 const missions=Object.fromEntries(dailyMissions(events,now).map(mission=>[mission.id,mission]));
 assert.equal(missions.herhaal.count,1);assert.equal(missions.nieuw.count,2);assert.equal(missions.zinnen.count,1);
 assert.ok(Object.values(missions).every(mission=>!mission.done));
});

test('stamps are earned from real milestones only',()=>{
 assert.deepEqual(gameStats({},[]).earned,[]);
 const now=new Date(2026,10,14,12);
 const reviews=Object.fromEntries(vocabulary.slice(0,12).map(card=>[card.id,scheduleReview({},4,now)]));
 const events=Object.keys(reviews).map(id=>event(id,4,at(2026,10,14)));
 const stats=gameStats(reviews,events,now);
 assert.ok(stats.earned.includes('fiets'));assert.ok(!stats.earned.includes('vuur'));
 assert.equal(stats.streak.count,1);assert.equal(stats.practisedCards,12);
 assert.equal(new Set(stamps.map(stamp=>stamp.id)).size,stamps.length);
});
