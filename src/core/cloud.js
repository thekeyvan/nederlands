// Optional Google sign-in and Supabase sync. No DOM access: the UI subscribes to the cloud state.
import {preferenceSnapshot,switchPreferences,mergePreferences} from './preferences.js';
import {cloudConfig,loadCloudConfig} from './cloud-config.js';
import {getProgress,getIdentity,switchUser,mergeCloud,clearGuestAfterSync} from './progress-store.js';

let client=null,user=null,working=false,rerun=false,initializing=false,started=false;
// status: starting | local-only | unavailable | guest | syncing | saved | retry | load-failed
let state={status:'starting',user:null};
const listeners=new Set();
function set(patch){state={...state,...patch};for(const listener of listeners)listener(state);}
export const getCloud=()=>state;
export function subscribeCloud(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
function message(text){window.dispatchEvent(new CustomEvent('auth-message',{detail:text}));}
const profile=next=>next?{id:next.id,name:next.user_metadata?.full_name||next.user_metadata?.name||next.email||'',email:next.email||''}:null;

export async function signIn(){
 if(user)return;
 if(!client){message('Inloggen is nu niet beschikbaar. Je kunt wel oefenen.');return;}
 try{
  const response=await fetch(`${cloudConfig.url}/auth/v1/settings`,{headers:{apikey:cloudConfig.key}});const settings=await response.json();
  if(!response.ok||!settings.external?.google){message('Google-inloggen wordt nog ingesteld. Je voortgang blijft op dit apparaat.');return;}
 }catch{message('Geen verbinding. Je kunt op dit apparaat verder oefenen.');return;}
 const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/leren.html`,queryParams:{prompt:'select_account'}}});
 if(error)message('Inloggen lukt nu niet. Probeer het later opnieuw.');
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
 const next=session?.user||null;if(next?.id===user?.id&&getIdentity()===(next?.id||'guest'))return;
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
  client=createClient(cloudConfig.url,cloudConfig.key,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
 }catch{set({status:'unavailable'});return;}
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
