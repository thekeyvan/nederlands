import {cancelDutchSpeech} from './speech.js';
import {themes} from './learning-data.js';
import {getProgress,reviewCard} from './progress-store.js';
import {ratings,scheduleReview} from './srs.js';
import {planSession} from './learning-model.js';
import {t} from './i18n.js';
import {$,el,icon,button,translated,listenButton} from './ui.js';
export function createReview({onEnter,onOpenTheme}){
 let queue=[],index=0,revealed=false,grades=[],origin='all';
 for(const theme of [...themes,{id:'zinsbouw',title:'Zinsbouw'}]){const option=el('option','',theme.title);option.value=theme.id;$('#review-theme').append(option);}
 function controls(active){$('#review-setup').hidden=active;$('#review-session').hidden=!active;$('#stop-review').hidden=!active;}
 function start(options={}){
  origin=options.theme || $('#review-theme').value;$('#review-theme').value=origin;
  if(options.type)$('#review-type').value=options.type;
  queue=planSession(getProgress().reviews,{theme:origin,type:$('#review-type').value,limit:options.limit || 20});index=0;grades=[];controls(true);onEnter();render();
 }
 function practice(card){origin=card.themeId;$('#review-theme').value=origin;$('#review-type').value=card.id.startsWith('zin:')?'zinnen':card.id.startsWith('phrase:')?'praktisch':'woorden';queue=[card];index=0;grades=[];controls(true);onEnter();render();}
 function finish(){
  const area=$('#review-area'),mark=el('div','completion-icon');mark.append(icon(queue.length?'check':'sun'));
  area.replaceChildren(mark,el('p','eyebrow',queue.length?'GOED GEDAAN':'ALLES VOOR NU'),el('h2','',queue.length?`${queue.length} ${queue.length===1?'kaartje':'kaartjes'} geoefend.`:'Je bent weer bij.'),el('p','completion-copy',queue.length?`${grades.filter(grade=>grade>=3).length} keer goed herinnerd. Je volgende herhaling staat klaar.`:'Voor deze keuze zijn nu geen kaartjes klaar. Kies een ander thema of kom later terug.'));
  const actions=el('div','completion-actions');actions.append(button(origin==='all'||origin==='zinsbouw'?'Ontdek een thema':'Terug naar je thema',()=>onOpenTheme(origin==='all'||origin==='zinsbouw'?null:origin),'button secondary'),button('Nog een rondje',()=>start(),'button primary','arrow-right'));area.append(actions);$('#stop-review').hidden=true;$('.keyboard-tip').hidden=true;
 }
 function render(){
  cancelDutchSpeech();revealed=false;$('#session-position').textContent=`${Math.min(index+1,queue.length)} / ${queue.length}`;$('#session-progress').max=Math.max(1,queue.length);$('#session-progress').value=index;
  if(index>=queue.length){$('#session-position').textContent=`${queue.length} / ${queue.length}`;finish();return;}
  const card=queue[index],grammar=card.id.startsWith('zin:'),reverse=$('#review-direction').value==='local-nl'&&!grammar;
  $('#session-theme').textContent=grammar?'Zinsbouw':card.themeTitle;$('.keyboard-tip').hidden=false;
  const question=reverse?translated(card.meaning,'review-question'):el('p','review-question',grammar?card.prompt:card.nl);
  const reveal=button('Bekijk het antwoord',()=>revealAnswer(),'button primary');reveal.id='reveal-answer';
  $('#review-area').replaceChildren(el('p','eyebrow',grammar?'MAAK DE ZIN AF':reverse?'ZEG HET IN HET NEDERLANDS':'WEET JE HET NOG?'),question,translated(t(grammar?'grammarHint':reverse?'reverseHint':'meaningHint'),'review-hint'),reveal);reveal.focus({preventScroll:true});
 }
 function grade(value){if(!revealed||index>=queue.length)return;reviewCard(queue[index].id,value);grades.push(value);index++;render();}
 function revealAnswer(){
  if(revealed||index>=queue.length)return;revealed=true;$('#reveal-answer').remove();const card=queue[index],grammar=card.id.startsWith('zin:'),reverse=$('#review-direction').value==='local-nl'&&!grammar,answer=el('div','review-answer');
  if(grammar)answer.append(el('p','nl-answer',card.answer),el('p','answer-example',card.example),translated(card.translation,'answer-note'),translated(card.rule,'answer-note'));
  else{answer.append(reverse?el('p','nl-answer',card.nl):translated(card.meaning));if(card.example)answer.append(el('p','answer-example',card.example),translated(card.translation,'answer-note'));answer.append(listenButton(card.example||card.nl));}
  const choices=el('div','review-ratings');for(const rating of ratings){const next=scheduleReview(getProgress().reviews[card.id],rating.grade),choice=button(rating.label,()=>grade(rating.grade),'');choice.append(translated(t(`rating${rating.grade}`)),el('small','',`over ${next.interval} ${next.interval===1?'dag':'dagen'}`));choices.append(choice);}
  $('#review-area').append(answer,choices);choices.querySelector('button').focus({preventScroll:true});
 }
 $('#review-type').addEventListener('change',()=>{if($('#review-type').value==='zinnen')$('#review-theme').value='zinsbouw';else if($('#review-theme').value==='zinsbouw')$('#review-theme').value='all';});
 $('#review-theme').addEventListener('change',()=>{if($('#review-theme').value==='zinsbouw')$('#review-type').value='zinnen';else if($('#review-type').value==='zinnen')$('#review-type').value='all';});
 $('#review-start').addEventListener('click',()=>start());$('#stop-review').addEventListener('click',()=>{cancelDutchSpeech();queue=[];index=0;controls(false);$('#review-start').focus();});
 document.addEventListener('keydown',event=>{
  if($('#panel-oefenen').hidden||$('#review-session').hidden||$('#word-dialog').open||event.altKey||event.ctrlKey||event.metaKey||event.repeat||/INPUT|SELECT|TEXTAREA|SUMMARY/.test(event.target.tagName))return;
  if(index>=queue.length)return;
  if(event.code==='Space'&&!revealed){event.preventDefault();revealAnswer();}
  if(revealed&&['1','2','3','4'].includes(event.key)){event.preventDefault();grade(ratings[Number(event.key)-1].grade);}
 });
 return {start,practice};
}
