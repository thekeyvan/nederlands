// Optional account (Apple or Google) and progress sync with nedfa.nl's own API on Railway.
// The session is an httpOnly cookie, so this file never sees a token. No DOM access: the UI subscribes to the cloud state.
import {preferenceSnapshot,switchPreferences,mergePreferences} from './preferences.js';
import {cloudConfig,loadCloudConfig} from './cloud-config.js';
import {getProgress,getIdentity,switchUser,mergeCloud,clearGuestAfterSync} from './progress-store.js';
import {trackEvent} from '../lib/stats';

let user=null,working=false,rerun=false,initializing=false,started=false;
// status: starting | local-only | unavailable | guest | syncing | saved | retry | load-failed
let state={status:'starting',user:null};
const listeners=new Set();
function set(patch){state={...state,...patch};for(const listener of listeners)listener(state);}
export const getCloud=()=>state;
export function subscribeCloud(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
function message(text){window.dispatchEvent(new CustomEvent('auth-message',{detail:text}));}
const profile=next=>next?{id:next.id,name:next.name||next.email||'',email:next.email||'',providers:next.providers||[],provider:next.providers?.[0]||'google'}:null;

// The Services ID registered for nedfa.nl (Sign in with Apple JS).
const APPLE_WEB_ID='nl.nedfa.web';
export const appleAvailable=()=>cloudConfig.appleWeb===true;

async function api(path,{method='GET',body}={}){
 const response=await fetch(`/api${path}`,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const error=new Error(data.error||`HTTP ${response.status}`);error.status=response.status;throw error;}
 return data;
}

/** Signs in, or with `link` adds this Apple or Google account to the one you are signed in with. */
export async function signIn(provider='google',{link=false}={}){
 if(user&&!link)return;
 if(state.status==='local-only'||state.status==='unavailable'){message('Inloggen is nu niet beschikbaar. Je kunt wel oefenen.');return;}
 trackEvent(link?'koppelen':'inloggen',{provider});
 // Apple's popup must open straight from the tap, so this runs before anything is awaited.
 if(provider==='apple'){await signInWithApple(link);return;}
 if(user)await sync();
 const params=new URLSearchParams({return:`${location.pathname}${location.hash}`});
 if(link)params.set('link','1');
 location.assign(`/api/auth/google?${params}`);
}
export const linkProvider=provider=>signIn(provider,{link:true});

/** Removes Apple or Google from the account (only when the other one stays). */
export async function unlinkProvider(provider){
 try{const {user:next}=await api(`/me/identities/${provider}`,{method:'DELETE'});user=next;set({user:profile(next)});}
 catch(error){message(error.status===409?'Je hebt minstens één manier van inloggen nodig.':'Dat lukt nu niet. Probeer het later opnieuw.');}
}

const hex=bytes=>[...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
// Sign in with Apple JS: loaded and given a fresh nonce ahead of time, so the tap opens the popup at once.
let appleWeb=null;
async function prepareApple(){
 if(!cloudConfig.appleWeb||typeof window==='undefined')return;
 if(!window.AppleID){
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/nl_NL/appleid.auth.js';
   script.async=true;script.onload=resolve;script.onerror=reject;
   document.head.append(script);
  });
 }
 const raw=hex(crypto.getRandomValues(new Uint8Array(32)));
 const hashed=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)));
 window.AppleID.auth.init({clientId:APPLE_WEB_ID,scope:'name email',redirectURI:`${location.origin}/leren`,usePopup:true,nonce:hashed});
 appleWeb={raw};
}

async function signInWithApple(link){
 const prepared=appleWeb;
 if(!prepared||!window.AppleID){message('Inloggen met Apple wordt nog geladen. Probeer het zo opnieuw.');void prepareApple().catch(()=>{});return;}
 appleWeb=null;
 let result;
 try{result=await window.AppleID.auth.signIn();}
 catch(error){
  // Closing the Apple popup is not an error worth a message.
  if(!/popup_closed|user_cancel/i.test(String(error?.error||error?.message||error)))message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');
  return;
 }finally{void prepareApple().catch(()=>{});}
 const token=result?.authorization?.id_token;
 if(!token){message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');return;}
 // Apple only shares the name the first time.
 const name=[result.user?.name?.firstName,result.user?.name?.lastName].filter(Boolean).join(' ');
 try{
  const {user:next}=await api('/auth/apple',{method:'POST',body:{idToken:token,nonce:prepared.raw,name,link}});
  if(link){await setUser(next);message('Apple is gekoppeld aan je account.');return;}
  await setUser(next);
 }catch{message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');}
}

/** Deletes the account and everything saved with it, online and on this device. */
export async function deleteAccount(){
 if(user){
  try{await api('/me',{method:'DELETE'});}
  catch{message('Je account kon niet worden verwijderd. Controleer je verbinding en probeer het opnieuw.');return false;}
 }
 forgetDevice();
 return true;
}
/** Removes progress, settings and records from this device (and the offline audio, on the website). */
export function forgetDevice(){
 try{for(const key of Object.keys(localStorage))if(/^(mijn-)?nederlands/.test(key)||key.startsWith('sb-'))localStorage.removeItem(key);}catch{}
 if(typeof caches!=='undefined')void caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nederlands')).map(key=>caches.delete(key)))).catch(()=>{});
}

export async function signOut(){
 if(!user)return;
 await sync();
 try{await api('/auth/signout',{method:'POST'});}catch{message('Uitloggen lukt nu niet. Probeer het opnieuw.');return;}
 await setUser(null);
}

async function loadCloud(id){
 const {cards,events,preferences}=await api('/me/progress');
 if(id!==user?.id)return;
 mergePreferences(preferences);
 const reviews=Object.fromEntries(cards.map(card=>[card.card_id,{ease:Number(card.ease),interval:card.interval_days,repetitions:card.repetitions,due:card.due,lastReviewed:card.last_reviewed,grade:card.grade,reviews:card.reviews}]));
 mergeCloud(reviews,events.map(event=>({id:event.id,cardId:event.card_id,grade:event.grade,at:event.reviewed_at})));
}

export async function sync(){
 if(!user||initializing)return;
 if(working){rerun=true;return;}
 working=true;const id=user.id;set({status:'syncing'});
 try{
  const data=getProgress();
  await api('/me/sync',{method:'POST',body:{cards:Object.entries(data.reviews).map(([cardId,value])=>({id:cardId,...value})),events:data.events}});
  const prefs=preferenceSnapshot();
  if(prefs.updated_at)await api('/me/preferences',{method:'PUT',body:prefs});
  if(id===user?.id){clearGuestAfterSync();set({status:'saved'});}
 }catch(error){
  if(error.status===401){working=false;await setUser(null);return;}
  if(id===user?.id)set({status:'retry'});
 }
 finally{working=false;if(rerun){rerun=false;void sync();}}
}

async function setUser(next){
 // The same learner again (e.g. after linking): only refresh the profile.
 if(next?.id===user?.id&&getIdentity()===(next?.id||'guest')){user=next;set({user:profile(next),...(state.status==='starting'?{status:next?'saved':'guest'}:{})});return;}
 user=next;switchUser(next?.id);switchPreferences(next?.id);set({user:profile(next),status:next?'syncing':'guest'});
 if(!next)return;initializing=true;
 try{await loadCloud(next.id);}catch{set({status:'load-failed'});initializing=false;return;}
 initializing=false;await sync();
}

const loginMessages={cancelled:'Inloggen is niet afgerond. Je kunt het opnieuw proberen.',failed:'Inloggen lukt nu niet. Probeer het later opnieuw.',expired:'Inloggen duurde te lang. Probeer het opnieuw.'};

export async function initCloud(){
 if(started)return;started=true;
 await loadCloudConfig();
 if(!cloudConfig.auth){set({status:'local-only'});return;}
 const params=new URLSearchParams(location.search);
 const login=params.get('login');
 if(login){message(loginMessages[login]||loginMessages.failed);params.delete('login');history.replaceState(null,'',location.pathname+(params.size?`?${params}`:'')+location.hash);}
 let me;
 try{({user:me}=await api('/me'));}catch{set({status:'unavailable'});return;}
 await setUser(me);
 void prepareApple().catch(()=>{});
 window.addEventListener('learning-review',()=>void sync());
 window.addEventListener('learning-preferences-changed',()=>void sync());
 window.addEventListener('online',async()=>{if(user){try{await loadCloud(user.id);}catch{}void sync();}});
 document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&user&&!working){try{await loadCloud(user.id);}catch{}void sync();}});
}
