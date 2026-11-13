import test from 'node:test';
import assert from 'node:assert/strict';
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};globalThis.window=new EventTarget();
const {switchPreferences,notePreferenceChange,preferenceSnapshot,mergePreferences}=await import('../preferences.js');
test('preferences are separate per account and newer offline edits survive cloud sync',()=>{
 localStorage.setItem('mijn-nederlands-v1',JSON.stringify({saved:['nos'],week:'2026-11-09',done:[]}));notePreferenceChange();switchPreferences('alice');
 assert.deepEqual(preferenceSnapshot().data.saved,['nos']);
 mergePreferences({data:{saved:['slimme'],done:[],week:'2026-11-09'},updated_at:'2000-01-01T00:00:00Z'});
 assert.deepEqual(preferenceSnapshot().data.saved,['nos']);
 switchPreferences(null);switchPreferences('bob');
 localStorage.setItem('mijn-nederlands-v1',JSON.stringify({saved:['quizlet'],week:'2026-11-09',done:[]}));notePreferenceChange();switchPreferences('alice');
 assert.deepEqual(preferenceSnapshot().data.saved,['nos']);
});
