export const normalizeLanguage = language => String(language || '').trim().replaceAll('_','-').toLowerCase();
export function dutchVoices(voices){
 return voices.filter(voice=>/^nl(?:-|$)/.test(normalizeLanguage(voice.lang))&&!/\benglish\b/i.test(voice.name));
}
export const voiceKey=voice=>voice.voiceURI || `${voice.name}|${normalizeLanguage(voice.lang)}`;
export function chooseDutchVoice(voices,preferred=''){
 const choices=dutchVoices(voices);const saved=choices.find(voice=>voiceKey(voice)===preferred);if(saved)return saved;
 const rank=voice=>{
  const name=voice.name.toLowerCase(),language=normalizeLanguage(voice.lang);
  let score=language==='nl-nl'?20:language==='nl-be'?40:60;
  // Dedicated Dutch voices first; never just take the first OS voice in the list.
  if(/google.*nederlands|google.*dutch/.test(name))score-=20;
  else if(/\b(xander|claire|ellen|frank|femke)\b/.test(name))score-=10;
  if(/enhanced|premium|natural/.test(name))score-=3;
  if(/eloquence|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|superstar/.test(name))score+=100;
  return score;
 };
 return choices.map((voice,index)=>({voice,index,score:rank(voice)})).sort((a,b)=>a.score-b.score||a.index-b.index)[0]?.voice || null;
}
export function makeDutchUtterance(text,voice,Utterance,rate=.9){
 if(!voice||!dutchVoices([voice]).length)throw new Error('No Dutch voice');
 const utterance=new Utterance(text);
 // Match the selected voice exactly. Forcing nl-NL on an nl-BE voice can mismatch.
 utterance.lang=voice.lang.replaceAll('_','-');utterance.voice=voice;utterance.rate=rate;utterance.pitch=1;utterance.volume=1;
 return utterance;
}
