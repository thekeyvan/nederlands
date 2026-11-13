import {t} from './i18n.js';
import {preferenceSnapshot,switchPreferences,mergePreferences} from './preferences.js';
import {cloudConfig,loadCloudConfig} from './cloud-config.js';
import {getProgress,getIdentity,switchUser,mergeCloud,clearGuestAfterSync} from './progress-store.js';
let client=null,user=null,working=false,rerun=false,initializing=false;
const $=selector=>document.querySelector(selector);
function message(text){window.dispatchEvent(new CustomEvent('auth-message',{detail:text}));}
function status(text){const target=$('#sync-status');if(target)target.textContent=text;}
function showIdentity(){
 document.querySelectorAll('[data-sign-in]').forEach(button=>{button.textContent=user?'Mijn account':'Inloggen met Google';button.hidden=!!user&&button.closest('.account-box')!==null;});
 if($('#sign-out'))$('#sign-out').hidden=!user;
 if($('#account-title'))$('#account-title').textContent=user?'Je bent ingelogd.':'Neem je voortgang mee.';
 if($('#account-copy'))$('#account-copy').textContent=user?'Je oefeningen worden bij je Google-account bewaard.':'Log in met Google om op je telefoon en computer verder te gaan.';
 if($('#account-translation'))$('#account-translation').textContent=user?t('accountSignedIn'):t('accountGuest');
 status(user?'Je voortgang wordt gesynchroniseerd.':'Je voortgang blijft op dit apparaat.');
}
async function signIn(){
 if(user){const tab=document.querySelector('[data-panel="voortgang"]');if(tab)tab.click();else location.href='./leren.html#voortgang';return;}
 if(!client){message('Inloggen is nu niet beschikbaar. Je kunt wel oefenen.');return;}
 try{const response=await fetch(`${cloudConfig.url}/auth/v1/settings`,{headers:{apikey:cloudConfig.key}});const settings=await response.json();if(!response.ok||!settings.external?.google){message('Google-inloggen wordt nog ingesteld. Je voortgang blijft op dit apparaat.');return;}}catch{message('Geen verbinding. Je kunt op dit apparaat verder oefenen.');return;}
 const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${location.origin}/leren.html`,queryParams:{prompt:'select_account'}}});
 if(error)message('Inloggen lukt nu niet. Probeer het later opnieuw.');
}
async function loadCloud(id){
 const [cards,events,prefs]=await Promise.all([client.from('review_cards').select('*').limit(1000),client.from('review_events').select('id,card_id,grade,reviewed_at').order('reviewed_at',{ascending:false}).limit(2000),client.from('learning_preferences').select('data,updated_at').maybeSingle()]);
 if(id!==user?.id)return;
 if(cards.error||events.error||prefs.error)throw cards.error||events.error||prefs.error;
 mergePreferences(prefs.data);
 const reviews=Object.fromEntries(cards.data.map(card=>[card.card_id,{ease:Number(card.ease),interval:card.interval_days,repetitions:card.repetitions,due:card.due,lastReviewed:card.last_reviewed,grade:card.grade,reviews:card.reviews}]));
 mergeCloud(reviews,events.data.map(e=>({id:e.id,cardId:e.card_id,grade:e.grade,at:e.reviewed_at})));
}
export async function sync(){
 if(!client||!user||initializing)return;
 if(working){rerun=true;return;}
 working=true;const id=user.id;status('Opslaan…');
 try{
  const data=getProgress();const {error}=await client.rpc('sync_learning',{payload:{cards:Object.entries(data.reviews).map(([id,value])=>({id,...value})),events:data.events}});
  if(error)throw error;
  const prefs=preferenceSnapshot();
  if(prefs.updated_at){const result=await client.from('learning_preferences').upsert({user_id:id,...prefs});if(result.error)throw result.error;}
  if(id===user?.id){clearGuestAfterSync();status('Opgeslagen in je account.');}
 }catch{if(id===user?.id)status('Nog niet online opgeslagen. Je voortgang staat op dit apparaat; we proberen het opnieuw.');}
 finally{working=false;if(rerun){rerun=false;void sync();}}
}
async function setSession(session){
 const next=session?.user||null;if(next?.id===user?.id&&getIdentity()===(next?.id||'guest'))return;
 user=next;switchUser(next?.id);switchPreferences(next?.id);showIdentity();
 if(!next)return;initializing=true;
 try{await loadCloud(next.id);}catch{status('Je online voortgang kon niet worden geladen. Je kunt lokaal verder oefenen.');initializing=false;return;}
 initializing=false;await sync();
}
export async function initCloud(){
 await loadCloudConfig();
 document.querySelectorAll('[data-sign-in]').forEach(button=>button.addEventListener('click',signIn));
 if(!cloudConfig.key){document.querySelectorAll('[data-sign-in]').forEach(button=>button.hidden=true);status('Je oefent lokaal. Inloggen is niet ingesteld.');if($('#account-title'))$('#account-title').textContent='Je oefent op dit apparaat.';if($('#account-copy'))$('#account-copy').textContent='Deze versie werkt zonder account.';if($('#account-translation'))$('#account-translation').hidden=true;return;}
 const {createClient}=await import('./assets/supabase.js');
 client=createClient(cloudConfig.url,cloudConfig.key,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
 const params=new URLSearchParams(location.search);if(params.has('error')){message('Google-inloggen is niet afgerond. Je kunt het opnieuw proberen.');history.replaceState(null,'',location.pathname+location.hash);}
 const {data,error}=await client.auth.getSession();
 if(error)message('Je sessie kon niet worden geladen. Log opnieuw in.');
 if(params.has('code'))history.replaceState(null,'',location.pathname+location.hash);
 await setSession(data?.session);
 client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>void setSession(session),0);});
 $('#sign-out')?.addEventListener('click',async()=>{await sync();const {error}=await client.auth.signOut({scope:'local'});if(error){message('Uitloggen lukt nu niet. Probeer het opnieuw.');return;}await setSession(null);});
 window.addEventListener('learning-review',()=>void sync());
 window.addEventListener('learning-preferences-changed',()=>void sync());
 window.addEventListener('online',async()=>{if(user){try{await loadCloud(user.id);}catch{}void sync();}});
 document.addEventListener('visibilitychange',async()=>{if(!document.hidden&&user&&!working){try{await loadCloud(user.id);}catch{}void sync();}});
}
