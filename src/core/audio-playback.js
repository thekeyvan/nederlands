import {audioCatalog} from './audio-catalog.js';
export const audioSpeeds=[0.75,0.85,1,1.15,1.25];
export const validSpeed=value=>audioSpeeds.includes(Number(value))?Number(value):1;
export const validVoice=id=>audioCatalog.voices.some(voice=>voice.id===id)?id:audioCatalog.defaultVoice;
export function audioUrl(text,voice){
 const key=Object.hasOwn(audioCatalog.clips,text)?audioCatalog.clips[text]:null;
 return key?`./assets/audio/${validVoice(voice)}/${key}.mp3`:null;
}
export function createPlayback(audio,onState=()=>{}){
 let request=0;
 const cancel=()=>{request++;audio.pause();audio.removeAttribute('src');audio.load();onState('idle');};
 return {cancel,setSpeed(value){audio.playbackRate=validSpeed(value);audio.preservesPitch=true;},async play(text,voice,speed=1){
  cancel();const ticket=request,url=audioUrl(text,voice);
  if(!url){onState('error');return false;}
  audio.src=url;audio.playbackRate=validSpeed(speed);audio.preservesPitch=true;
  audio.onplaying=()=>{if(ticket===request)onState('playing');};
  audio.onended=()=>{if(ticket===request)onState('ended');};
  audio.onerror=()=>{if(ticket===request)onState('error');};
  onState('loading');
  try{await audio.play();return ticket===request;}catch{if(ticket===request)onState('error');return false;}
 }};
}
