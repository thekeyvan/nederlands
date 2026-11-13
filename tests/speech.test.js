import test from 'node:test';
import assert from 'node:assert/strict';
import {stat,readFile} from 'node:fs/promises';
import {audioCatalog} from '../audio-catalog.js';
import {audioTexts} from '../scripts/audio-texts.mjs';
import {validVoice,validSpeed,audioSpeeds,audioUrl,createPlayback} from '../audio-playback.js';
test('every Dutch learning text has both bundled audio clips',async()=>{
 assert.equal(audioCatalog.language,'nl-NL');assert.deepEqual(audioCatalog.voices.map(v=>v.id),['ronnie','pim']);
 assert.equal(new Set(Object.values(audioCatalog.clips)).size,audioTexts.length);
 await Promise.all(audioTexts.flatMap(text=>audioCatalog.voices.map(async voice=>{
  const path=new URL(`../${audioUrl(text,voice.id)}`,import.meta.url);
  assert.ok((await stat(path)).size>500,`${voice.id}: ${text}`);
 })));
});
test('unknown text cannot use prototype keys; unknown voices use the bundled default',()=>{
 assert.equal(audioUrl('constructor','pim'),null);assert.equal(audioUrl('unrecorded text','ronnie'),null);
 assert.equal(validVoice('../anything'),'ronnie');
 assert.match(audioUrl(audioCatalog.sampleText,'Xander'),/^\.\/assets\/audio\/ronnie\/[a-f0-9]{24}\.mp3$/);
});
function fakeAudio(){return {src:'',paused:true,pause(){this.paused=true;},removeAttribute(){this.src='';},load(){},async play(){this.paused=false;this.onplaying();}};}
test('new playback replaces old audio; cancel stops it; slow playback keeps pitch',async()=>{
 const audio=fakeAudio(),states=[],player=createPlayback(audio,state=>states.push(state));
 assert.equal(await player.play(audioCatalog.sampleText,'pim',0.85),true);assert.match(audio.src,/\/pim\//);assert.equal(audio.playbackRate,0.85);assert.equal(audio.preservesPitch,true);
 const staleEnd=audio.onended;await player.play(audioTexts[0],'ronnie');assert.match(audio.src,/\/ronnie\//);assert.equal(audio.playbackRate,1);
 player.cancel();staleEnd();assert.equal(audio.paused,true);assert.equal(audio.src,'');assert.equal(states.at(-1),'idle');
});
test('missing or failed audio reports an error without device speech',async()=>{
 const audio=fakeAudio(),states=[],player=createPlayback(audio,state=>states.push(state));
 assert.equal(await player.play('missing text','pim'),false);assert.equal(states.at(-1),'error');
 audio.play=async()=>{throw new Error('offline');};assert.equal(await player.play(audioTexts[0],'pim'),false);assert.equal(states.at(-1),'error');
 assert.doesNotMatch(await readFile(new URL('../speech.js',import.meta.url),'utf8'),/speechSynthesis|SpeechSynthesisUtterance/);
});

test('saved speeds accept all five choices and reject damaged values',async()=>{
 const audio=fakeAudio(),player=createPlayback(audio);
 for(const speed of audioSpeeds){assert.equal(validSpeed(String(speed)),speed);await player.play(audioTexts[0],'ronnie',speed);assert.equal(audio.playbackRate,speed);assert.equal(audio.preservesPitch,true);}
 player.setSpeed(0.75);assert.equal(audio.paused,false);assert.equal(audio.playbackRate,0.75);
 for(const value of [null,'bad',0,Infinity,3])assert.equal(validSpeed(value),1);
});
