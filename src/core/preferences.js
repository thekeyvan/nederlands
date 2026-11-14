import {loadState} from './state.js';
import {resources} from './data.js';
let owner='guest',lastUpdate=null;
try{lastUpdate=localStorage.getItem('nederlands-preferences-updated:guest');}catch{}
const ids=resources.map(r=>r.id);
const safeStorage={getItem:key=>{try{return localStorage.getItem(key);}catch{return null;}}};
export function preferenceSnapshot(){
 return {data:loadState(safeStorage,ids),updated_at:lastUpdate};
}
export function notePreferenceChange(){
 lastUpdate=new Date().toISOString();
 try{localStorage.setItem(`nederlands-preferences-updated:${owner}`,lastUpdate);}catch{}
 window.dispatchEvent(new CustomEvent('learning-preferences-changed'));
}
export function switchPreferences(userId){
 const next=userId||'guest';if(next===owner)return;
 try{
  const current=localStorage.getItem('mijn-nederlands-v1');
  localStorage.setItem(`nederlands-preferences:${owner}`,current||'{}');
  const existing=localStorage.getItem(`nederlands-preferences:${next}`);
  const guest=owner==='guest'&&userId?current:null;
  localStorage.setItem('mijn-nederlands-v1',existing||guest||'{}');
  const guestUpdated=lastUpdate;
  lastUpdate=localStorage.getItem(`nederlands-preferences-updated:${next}`)||(!existing&&guest?guestUpdated||new Date().toISOString():null);
 }catch{}
 owner=next;window.dispatchEvent(new CustomEvent('learning-preferences-loaded'));
}
export function mergePreferences(remote){
 if(!remote)return;
 const local=preferenceSnapshot();
 if(!local.updated_at||new Date(remote.updated_at)>new Date(local.updated_at)){
  const state=loadState({getItem:()=>JSON.stringify(remote.data)},ids);
  try{localStorage.setItem('mijn-nederlands-v1',JSON.stringify(state));lastUpdate=remote.updated_at;localStorage.setItem(`nederlands-preferences-updated:${owner}`,lastUpdate);}catch{}
  window.dispatchEvent(new CustomEvent('learning-preferences-loaded'));
 }
}
