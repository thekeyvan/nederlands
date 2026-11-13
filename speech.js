import {dutchVoices,chooseDutchVoice,voiceKey,makeDutchUtterance} from './speech-voices.js';
let preferred='';try{preferred=localStorage.getItem('nederlands-speech-voice') || '';}catch{}
let dialog=null,select=null,description=null,notify=()=>{},activeUtterance=null,request=0;
const synth=typeof window==='undefined'?null:window.speechSynthesis;
const controls=new Set();
const getVoice=()=>chooseDutchVoice(synth?.getVoices() || [],preferred);
function textNode(tag,text,className=''){const node=document.createElement(tag);node.textContent=text;node.className=className;return node;}
function refresh(){
 const voice=getVoice();for(const control of controls){if(!control.wrapper.isConnected){controls.delete(control);continue;}control.play.title=voice?`${voice.name} · ${voice.lang}`:'Kies een Nederlandse stem';control.settings.title=voice?`Nederlandse stem: ${voice.name}`:'Nederlandse stem kiezen';}
 if(!dialog)return;const choices=dutchVoices(synth?.getVoices() || []);select.replaceChildren();
 if(!choices.length){const option=textNode('option','Geen Nederlandse stem beschikbaar');option.value='';select.append(option);}
 for(const choice of choices){const option=textNode('option',`${choice.name} (${choice.lang})`);option.value=voiceKey(choice);select.append(option);}
 select.disabled=!choices.length;select.value=voice?voiceKey(voice):'';
 description.textContent=voice?`Je hoort ${voice.name} (${voice.lang}). Alleen Nederlandse stemmen staan in deze lijst.`:'Dit apparaat heeft nog geen Nederlandse voorleesstem. Voeg Nederlands toe aan de spraakinstellingen van je apparaat. Er wordt geen Engelse stem gebruikt.';
 dialog.querySelector('[data-test-voice]').disabled=!voice;
}
function ensureDialog(){
 if(dialog)return;
 dialog=document.createElement('dialog');dialog.id='speech-dialog';dialog.className='speech-dialog';dialog.setAttribute('aria-labelledby','speech-title');
 const header=textNode('div','','speech-dialog-header'),title=textNode('h2','Nederlandse uitspraak');title.id='speech-title';const close=textNode('button','Sluiten','button secondary');close.type='button';close.addEventListener('click',()=>dialog.close());header.append(title,close);
 const label=textNode('label','Kies een Nederlandse stem');select=document.createElement('select');select.id='speech-voice';label.append(select);description=textNode('p','','speech-description');description.setAttribute('role','status');
 const sample=textNode('p','Goedemorgen! Ik leer Nederlands. Hoe gaat het met je?','speech-sample');const test=textNode('button','Test deze stem','button primary');test.type='button';test.dataset.testVoice='';test.addEventListener('click',()=>speakDutch(sample.textContent));
 select.addEventListener('change',()=>{preferred=select.value;try{localStorage.setItem('nederlands-speech-voice',preferred);}catch{}cancelDutchSpeech();refresh();});
 dialog.append(header,label,description,sample,test);document.body.append(dialog);dialog.addEventListener('close',cancelDutchSpeech);refresh();
}
async function waitForVoices(){
 if(!synth||getVoice())return;
 await new Promise(resolve=>{let timer;const finish=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',changed);resolve();};const changed=()=>{if(getVoice())finish();};timer=setTimeout(finish,1200);synth.addEventListener('voiceschanged',changed);synth.getVoices();});
}
export function cancelDutchSpeech(){request++;activeUtterance=null;synth?.cancel();}
export async function speakDutch(text){
 if(!synth)return;const ticket=++request;synth.cancel();await waitForVoices();if(ticket!==request)return;
 const voice=getVoice();if(!voice){notify('Er is geen Nederlandse stem beschikbaar. Kies of installeer eerst een Nederlandse stem.');ensureDialog();if(!dialog.open)dialog.showModal();return;}
 const utterance=makeDutchUtterance(text,voice,SpeechSynthesisUtterance);activeUtterance=utterance;
 utterance.onstart=()=>{if(dialog?.open)description.textContent=`Aan het voorlezen met ${voice.name} (${voice.lang})…`;};
 utterance.onerror=event=>{if(activeUtterance===utterance)activeUtterance=null;if(!['interrupted','canceled'].includes(event.error)){notify('Deze stem werkt niet. Kies een andere Nederlandse stem.');if(dialog?.open)description.textContent='Deze stem werkt niet. Kies een andere Nederlandse stem.';}};
 utterance.onend=()=>{if(activeUtterance===utterance)activeUtterance=null;if(dialog?.open)description.textContent=`Voorgelezen met ${voice.name} (${voice.lang}).`;};refresh();synth.speak(utterance);
}
export function createListenControl(text,{onMessage,icon}){
 notify=onMessage;const wrapper=textNode('span','','audio-control'),play=textNode('button','Luister','listen-button'),settings=textNode('button','Stem','voice-setting-button');play.type=settings.type='button';play.append(icon('volume-2'));play.setAttribute('aria-label',`Luister: ${text}`);play.addEventListener('click',()=>speakDutch(text));settings.setAttribute('aria-label','Nederlandse stem kiezen');settings.addEventListener('click',()=>{ensureDialog();refresh();dialog.showModal();});wrapper.append(play,settings);wrapper.hidden=!synth;controls.add({wrapper,play,settings});
 const voice=getVoice();if(voice){play.title=`${voice.name} · ${voice.lang}`;settings.title=`Nederlandse stem: ${voice.name}`;}return wrapper;
}
if(synth){synth.addEventListener('voiceschanged',refresh);synth.getVoices();}
