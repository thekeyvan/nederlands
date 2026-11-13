import {audioCatalog} from './audio-catalog.js';
import {validVoice,validSpeed,createPlayback} from './audio-playback.js';
let preferred=audioCatalog.defaultVoice,speed=1;
try{preferred=validVoice(localStorage.getItem('nederlands-audio-voice'));speed=validSpeed(localStorage.getItem('nederlands-audio-speed'));}catch{}
let dialog=null,select=null,description=null,speedSelect=null,notify=()=>{},player=null;
const controls=new Set();
const voiceName=()=>audioCatalog.voices.find(voice=>voice.id===preferred).name;
function textNode(tag,text,className=''){const node=document.createElement(tag);node.textContent=text;node.className=className;return node;}
function refresh(){
 for(const control of controls){if(!control.wrapper.isConnected){controls.delete(control);continue;}control.play.title=`${voiceName()} · Nederlands`;control.settings.textContent=voiceName();control.settings.title='Stem en snelheid kiezen';}
 if(dialog){select.value=preferred;speedSelect.value=String(speed);description.textContent=`Je hoort ${voiceName()}. Dit is Nederlandse audio, op elk apparaat dezelfde stem.`;}
}
function getPlayer(){
 if(player)return player;
 const audio=document.createElement('audio');audio.id='dutch-audio';audio.preload='none';audio.hidden=true;document.body.append(audio);
 player=createPlayback(audio,state=>{
  audio.dataset.state=state;
  const message={loading:'Audio laden…',playing:`Je luistert naar ${voiceName()}…`,ended:`Afgespeeld met ${voiceName()}.`,error:'De audio kan niet laden. Probeer het nog eens.'}[state];
  if(message&&dialog?.open)description.textContent=message;
  if(state==='error')notify(message);
 });return player;
}
function ensureDialog(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.id='speech-dialog';dialog.className='speech-dialog';dialog.setAttribute('aria-labelledby','speech-title');
 const header=textNode('div','','speech-dialog-header'),title=textNode('h2','Nederlandse audio');title.id='speech-title';const close=textNode('button','Sluiten','button secondary');close.type='button';close.addEventListener('click',()=>dialog.close());header.append(title,close);
 const label=textNode('label','Kies een stem');select=document.createElement('select');select.id='speech-voice';label.htmlFor=select.id;
 for(const voice of audioCatalog.voices){const option=textNode('option',`${voice.name} · Nederlands`);option.value=voice.id;select.append(option);}label.append(select);
 const speedLabel=textNode('label','Snelheid');speedSelect=document.createElement('select');speedSelect.id='speech-speed';speedLabel.htmlFor=speedSelect.id;
 for(const [value,name] of [[0.75,'0,75× · Langzaam'],[0.85,'0,85× · Rustig'],[1,'1× · Normaal'],[1.15,'1,15× · Vlot'],[1.25,'1,25× · Snel']]){const option=textNode('option',name);option.value=String(value);speedSelect.append(option);}speedLabel.append(speedSelect);
 description=textNode('p','','speech-description');description.setAttribute('role','status');
 const sample=textNode('p',audioCatalog.sampleText,'speech-sample'),test=textNode('button','Luister naar deze stem','button primary');test.type='button';test.dataset.testVoice='';test.addEventListener('click',()=>speakDutch(audioCatalog.sampleText));
 select.addEventListener('change',()=>{cancelDutchSpeech();preferred=validVoice(select.value);try{localStorage.setItem('nederlands-audio-voice',preferred);}catch{}refresh();});
 speedSelect.addEventListener('change',()=>{speed=validSpeed(speedSelect.value);player?.setSpeed(speed);try{localStorage.setItem('nederlands-audio-speed',String(speed));}catch{}refresh();});
 dialog.append(header,label,speedLabel,description,sample,test);document.body.append(dialog);dialog.addEventListener('close',cancelDutchSpeech);refresh();
}
export function cancelDutchSpeech(){player?.cancel();}
export function speakDutch(text){return getPlayer().play(text,preferred,speed);}
export function createListenControl(text,{onMessage,icon}){
 notify=onMessage;const wrapper=textNode('span','','audio-control'),play=textNode('button','Luister','listen-button'),settings=textNode('button',voiceName(),'voice-setting-button');play.type=settings.type='button';play.append(icon('volume-2'));play.setAttribute('aria-label',`Luister: ${text}`);play.addEventListener('click',()=>speakDutch(text));settings.setAttribute('aria-label','Nederlandse stem kiezen');settings.addEventListener('click',()=>{cancelDutchSpeech();ensureDialog();refresh();dialog.showModal();});wrapper.append(play,settings);controls.add({wrapper,play,settings});play.title=`${voiceName()} · Nederlands`;return wrapper;
}
