// Optional Google sign-in and Supabase sync. No DOM access: the UI subscribes to the cloud state.
import {preferenceSnapshot,switchPreferences,mergePreferences} from './preferences.js';
import {cloudConfig,loadCloudConfig} from './cloud-config.js';
import {getProgress,getIdentity,switchUser,mergeCloud,clearGuestAfterSync} from './progress-store.js';
import {Capacitor} from '@capacitor/core';

let client=null,user=null,working=false,rerun=false,initializing=false,started=false;
// status: starting | local-only | unavailable | guest | syncing | saved | retry | load-failed
let state={status:'starting',user:null};
const listeners=new Set();
function set(patch){state={...state,...patch};for(const listener of listeners)listener(state);}
export const getCloud=()=>state;
export function subscribeCloud(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
function message(text){window.dispatchEvent(new CustomEvent('auth-message',{detail:text}));}
const profile=next=>next?{id:next.id,name:next.user_metadata?.full_name||next.user_metadata?.name||next.email||'',email:next.email||'',provider:next.app_metadata?.provider||'google'}:null;

// In the iOS app the page runs from bundled files, so sign-in returns through a URL scheme
// (Google, in Safari) or the native Apple sheet instead of a web redirect.
const native=Capacitor.isNativePlatform();
const AUTH_CALLBACK='com.keyvanmahmoudi.nederlands://auth';
const APPLE_CLIENT_ID='com.keyvanmahmoudi.nederlands';
// The Services ID registered for nedfa.nl; Supabase accepts its tokens without an OAuth secret.
const APPLE_WEB_ID='com.keyvanmahmoudi.nederlands.web';
// Apple sign-in: the native sheet in the iOS app; Sign in with Apple JS on the website.
export const appleAvailable=()=>(native&&Capacitor.getPlatform()==='ios')||cloudConfig.appleWeb===true;

async function providerReady(provider){
 try{
  const response=await fetch(`${cloudConfig.url}/auth/v1/settings`,{headers:{apikey:cloudConfig.key}});const settings=await response.json();
  if(!response.ok||!settings.external?.[provider]){message(`${provider==='apple'?'Inloggen met Apple':'Google-inloggen'} wordt nog ingesteld. Je voortgang blijft op dit apparaat.`);return false;}
  return true;
 }catch{message('Geen verbinding. Je kunt op dit apparaat verder oefenen.');return false;}
}

export async function signIn(provider='google'){
 if(user)return;
 if(!client){message('Inloggen is nu niet beschikbaar. Je kunt wel oefenen.');return;}
 // Apple's popup must open straight from the tap, so this runs before anything is awaited.
 if(provider==='apple'&&!native){await signInWithAppleWeb();return;}
 if(!await providerReady(provider))return;
 if(provider==='apple'&&native){await signInWithApple();return;}
 if(native){
  const {data,error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:AUTH_CALLBACK,skipBrowserRedirect:true,queryParams:{prompt:'select_account'}}});
  if(error||!data?.url){message('Inloggen lukt nu niet. Probeer het later opnieuw.');return;}
  const {Browser}=await import('@capacitor/browser');
  await Browser.open({url:data.url,presentationStyle:'popover'});
  return;
 }
 const {error}=await client.auth.signInWithOAuth({provider,options:{redirectTo:`${location.origin}/leren`,...(provider==='google'?{queryParams:{prompt:'select_account'}}:{})}});
 if(error)message('Inloggen lukt nu niet. Probeer het later opnieuw.');
}

const hex=bytes=>[...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
async function signInWithApple(){
 // Apple signs a hash of the nonce; Supabase checks it against the raw value.
 const raw=hex(crypto.getRandomValues(new Uint8Array(32)));
 const hashed=hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)));
 let result;
 try{
  const {SignInWithApple}=await import('@capacitor-community/apple-sign-in');
  result=await SignInWithApple.authorize({clientId:APPLE_CLIENT_ID,redirectURI:AUTH_CALLBACK,scopes:'email name',nonce:hashed});
 }catch(error){
  // Closing the Apple sheet is not an error worth a message.
  if(!/cancel|1001/i.test(String(error?.message||error?.code||'')))message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');
  return;
 }
 const token=result?.response?.identityToken;
 if(!token){message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');return;}
 const {data,error}=await client.auth.signInWithIdToken({provider:'apple',token,nonce:raw});
 if(error){message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');return;}
 // Apple only shares the name the first time; keep it on the account.
 const name=[result.response.givenName,result.response.familyName].filter(Boolean).join(' ');
 if(name&&!data.user?.user_metadata?.full_name)await client.auth.updateUser({data:{full_name:name}});
}

// Sign in with Apple JS: loaded and given a fresh nonce ahead of time, so the tap opens the popup at once.
let appleWeb=null;
async function prepareAppleWeb(){
 if(native||!cloudConfig.appleWeb||typeof window==='undefined')return;
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

async function signInWithAppleWeb(){
 const prepared=appleWeb;
 if(!prepared||!window.AppleID){message('Inloggen met Apple wordt nog geladen. Probeer het zo opnieuw.');void prepareAppleWeb().catch(()=>{});return;}
 appleWeb=null;
 let result;
 try{result=await window.AppleID.auth.signIn();}
 catch(error){
  // Closing the Apple popup is not an error worth a message.
  if(!/popup_closed|user_cancel/i.test(String(error?.error||error?.message||error)))message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');
  return;
 }finally{void prepareAppleWeb().catch(()=>{});}
 const token=result?.authorization?.id_token;
 if(!token){message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');return;}
 const {data,error}=await client.auth.signInWithIdToken({provider:'apple',token,nonce:prepared.raw});
 if(error){message('Inloggen met Apple lukt nu niet. Probeer het later opnieuw.');return;}
 // Apple only shares the name the first time; keep it on the account.
 const name=[result.user?.name?.firstName,result.user?.name?.lastName].filter(Boolean).join(' ');
 if(name&&!data.user?.user_metadata?.full_name)await client.auth.updateUser({data:{full_name:name}});
}

async function finishNativeSignIn(url){
 if(!url?.startsWith(AUTH_CALLBACK))return;
 const {Browser}=await import('@capacitor/browser');
 void Browser.close().catch(()=>{});
 const params=new URL(url).searchParams;
 const code=params.get('code');
 if(!code){if(params.has('error'))message('Google-inloggen is niet afgerond. Je kunt het opnieuw proberen.');return;}
 const {error}=await client.auth.exchangeCodeForSession(code);
 if(error)message('Inloggen lukt nu niet. Probeer het later opnieuw.');
}

/** Deletes the account and everything saved with it, online and on this device. */
export async function deleteAccount(){
 if(client&&user){
  const {error}=await client.rpc('delete_my_account');
  if(error){message('Je account kon niet worden verwijderd. Controleer je verbinding en probeer het opnieuw.');return false;}
  await client.auth.signOut({scope:'local'}).catch(()=>{});
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
 if(!client||!user)return;
 await sync();
 const {error}=await client.auth.signOut({scope:'local'});
 if(error){message('Uitloggen lukt nu niet. Probeer het opnieuw.');return;}
 await setSession(null);
}

async function loadCloud(id){
 const [cards,events,prefs]=await Promise.all([client.from('review_cards').select('*').limit(1000),client.from('review_events').select('id,card_id,grade,reviewed_at').order('reviewed_at',{ascending:false}).limit(2000),client.from('learning_preferences').select('data,updated_at').maybeSingle()]);
 if(id!==user?.id)return;
 if(cards.error||events.error||prefs.error)throw cards.error||events.error||prefs.error;
 mergePreferences(prefs.data);
 const reviews=Object.fromEntries(cards.data.map(card=>[card.card_id,{ease:Number(card.ease),interval:card.interval_days,repetitions:card.repetitions,due:card.due,lastReviewed:card.last_reviewed,grade:card.grade,reviews:card.reviews}]));
 mergeCloud(reviews,events.data.map(event=>({id:event.id,cardId:event.card_id,grade:event.grade,at:event.reviewed_at})));
}

export async function sync(){
 if(!client||!user||initializing)return;
 if(working){rerun=true;return;}
 working=true;const id=user.id;set({status:'syncing'});
 try{
  const data=getProgress();const {error}=await client.rpc('sync_learning',{payload:{cards:Object.entries(data.reviews).map(([cardId,value])=>({id:cardId,...value})),events:data.events}});
  if(error)throw error;
  const prefs=preferenceSnapshot();
  if(prefs.updated_at){const result=await client.from('learning_preferences').upsert({user_id:id,...prefs});if(result.error)throw result.error;}
  if(id===user?.id){clearGuestAfterSync();set({status:'saved'});}
 }catch{if(id===user?.id)set({status:'retry'});}
 finally{working=false;if(rerun){rerun=false;void sync();}}
}

async function setSession(session){
 const next=session?.user||null;
 // A first check without a session is still an answer: leave "starting" so the sign-in button appears.
 if(next?.id===user?.id&&getIdentity()===(next?.id||'guest')){if(state.status==='starting')set({status:next?'saved':'guest'});return;}
 user=next;switchUser(next?.id);switchPreferences(next?.id);set({user:profile(next),status:next?'syncing':'guest'});
 if(!next)return;initializing=true;
 try{await loadCloud(next.id);}catch{set({status:'load-failed'});initializing=false;return;}
 initializing=false;await sync();
}

export async function initCloud(){
 if(started)return;started=true;
 await loadCloudConfig();
 if(!cloudConfig.key){set({status:'local-only'});return;}
 try{
  const {createClient}=await import('@supabase/supabase-js');
  client=createClient(cloudConfig.url,cloudConfig.key,{auth:{flowType:'pkce',detectSessionInUrl:!native,persistSession:true,autoRefreshToken:true}});
 }catch{set({status:'unavailable'});return;}
 if(native){
  const {App}=await import('@capacitor/app');
  App.addListener('appUrlOpen',event=>void finishNativeSignIn(event.url));
 }
 void prepareAppleWeb().catch(()=>{});
 const params=new URLSearchParams(location.search);
 if(params.has('error')){message('Google-inloggen is niet afgerond. Je kunt het opnieuw proberen.');history.replaceState(null,'',location.pathname+location.hash);}
 const {data,error}=await client.auth.getSession();
 if(error)message('Je sessie kon niet worden geladen. Log opnieuw in.');
 if(params.has('code'))history.replaceState(null,'',location.pathname+location.hash);
 await setSession(data?.session);
 client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>void setSession(session),0);});
 window.addEventListener('learning-review',()=>void sync());
 window.addEventListener('learning-preferences-changed',()=>void sync());
 window.addEventListener('online',async()=>{if(user){try{await loadCloud(user.id);}catch{}void sync();}});
 document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&user&&!working){try{await loadCloud(user.id);}catch{}void sync();}});
}
