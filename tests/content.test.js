import test from 'node:test';
import assert from 'node:assert/strict';
import {resources, ideas, weekTasks} from '../src/core/data.js';
import {weekKey, loadState, matchingResources} from '../src/core/state.js';
test('all sources have safe URLs, unique IDs and a complete exercise',()=>{
 assert.equal(new Set(resources.map(r=>r.id)).size,resources.length);
 assert.equal(resources.filter(r=>r.start).length,6);
 for(const r of resources){assert.equal(new URL(r.url).protocol,'https:');assert.equal(r.steps.length,3);assert.ok(['A2','B1'].includes(r.level));}
 for(const i of ideas) assert.ok(resources.some(r=>r.id===i.resource));
 assert.equal(weekTasks.length,5);
});
test('filters search the full library and keep B1 material out of A2',()=>{
 const search=matchingResources(resources,{category:'all',level:'all',query:'Forvo'},[]);
 assert.equal(search[0].id,'forvo');
 assert.equal(matchingResources(resources,{category:'start',level:'B1',query:''},[]).length,6);
 assert.ok(matchingResources(resources,{category:'Luisteren',level:'A2',query:''},[]).every(r=>r.level==='A2'));
 assert.equal(matchingResources(resources,{category:'saved',level:'all',query:''},['slimme']).length,1);
 assert.equal(matchingResources(resources,{category:'all',level:'all',query:'zzzz-nothing'},[]).length,0);
});
test('week starts Monday, including year boundaries',()=>{
 assert.equal(weekKey(new Date(2027,0,3)),'2026-12-28');
 assert.equal(weekKey(new Date(2027,0,4)),'2027-01-04');
 assert.equal(weekKey(new Date(2026,10,15)),'2026-11-09');
});
test('storage is safe when missing or damaged and resets only weekly tasks',()=>{
 const valid=resources.map(r=>r.id), storage={getItem:()=>JSON.stringify({saved:['nos','nos','bad'],week:'2026-11-09',done:['listen','bad']})};
 assert.deepEqual(loadState(storage,valid,'2026-11-09').saved,['nos']);
 assert.deepEqual(loadState(storage,valid,'2026-11-09').done,['listen']);
 assert.deepEqual(loadState(storage,valid,'2026-11-16').done,[]);
 assert.deepEqual(loadState({getItem:()=>'{bad'},valid).saved,[]);
 assert.deepEqual(loadState({getItem:()=>{throw new Error('storage blocked');}},valid).saved,[]);
 assert.deepEqual(loadState({getItem:()=> 'null'},valid).done,[]);
});
