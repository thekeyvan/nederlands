import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseDutchVoice,dutchVoices,makeDutchUtterance,voiceKey} from '../speech-voices.js';
const english={name:'Google US English',lang:'en-US',voiceURI:'en'};
const belgian={name:'Ellen',lang:'nl-BE',voiceURI:'ellen'};
const dutch={name:'Xander',lang:'nl-NL',voiceURI:'xander'};
const google={name:'Google Nederlands',lang:'nl-NL',voiceURI:'google-nl'};
test('Dutch voice selection prefers dedicated Dutch voices, not OS list order',()=>{
 const novelty={name:'Rocko',lang:'nl-NL',voiceURI:'rocko'};
 assert.equal(chooseDutchVoice([english,novelty,belgian,dutch,google]),google);
 assert.equal(chooseDutchVoice([novelty,belgian,dutch]),dutch);
 assert.equal(chooseDutchVoice([english]),null);
 assert.equal(chooseDutchVoice([{...english,lang:'nl-NL'}]),null);
});
test('a saved Dutch choice is kept; a saved English choice is rejected',()=>{
 assert.equal(chooseDutchVoice([english,dutch,google],voiceKey(dutch)),dutch);
 assert.equal(chooseDutchVoice([english,dutch],voiceKey(english)),dutch);
 assert.deepEqual(dutchVoices([{name:'Dutch',lang:'nl_NL'},english]).map(voice=>voice.lang),['nl_NL']);
});
test('utterances bind the actual voice and matching language without English fallback',()=>{
 class Utterance{constructor(text){this.text=text;}}
 const utterance=makeDutchUtterance('Ik leer Nederlands.',belgian,Utterance);
 assert.equal(utterance.voice,belgian);assert.equal(utterance.lang,'nl-BE');assert.equal(utterance.text,'Ik leer Nederlands.');
 assert.throws(()=>makeDutchUtterance('Hallo',english,Utterance),/No Dutch voice/);
 assert.throws(()=>makeDutchUtterance('Hallo',null,Utterance),/No Dutch voice/);
});
