import {cancelDutchSpeech} from './speech.js';
import {getProgress} from './progress-store.js';
import {progressStatus} from './srs.js';
import {$,el,icon,button,translated,listenButton} from './ui.js';
const statuses={new:'Nog niet geoefend',learning:'Aan het leren',known:'Goed onthouden'};
const kinds={woord:'Woord',werkwoord:'Werkwoord',uitdrukking:'Uitdrukking'};
export function createWordDialog(onPractice){
 let list=[],index=0;const dialog=$('#word-dialog');
 function render(){
  const word=list[index];if(!word)return;
  $('#detail-category').textContent=`${kinds[word.kind]} · ${word.themeTitle}`;
  const row=el('div','word-title-row'),heading=el('h2','',word.nl);heading.id='detail-title';row.append(heading,listenButton(word.nl));
  const detail=$('#word-detail');detail.replaceChildren(row,translated(word.meaning,'meaning'),el('span','word-status',statuses[progressStatus(getProgress().reviews[word.id])]));
  const example=el('div','word-example');example.append(el('p','example-label','ZO GEBRUIK JE HET'),el('p','nl-example',word.example),translated(word.translation),listenButton(word.example));detail.append(example);
  if(word.forms){const details=el('details','verb-details'),forms=el('dl','verb-forms');details.append(el('summary','','Bekijk de werkwoordsvormen'));for(const [label,value]of [['Infinitief',word.nl],['Imperfectum',word.forms[0]],['Perfectum',word.forms[1]],['Vorm',word.forms[2]]]){const field=el('div');field.append(el('dt','',label),el('dd','',value));forms.append(field);}details.append(forms);detail.append(details);}
  detail.append(button('Oefen dit kaartje',()=>{dialog.close();onPractice(word);},'button primary detail-practice','arrow-right'));
  $('#detail-prev').disabled=index===0;$('#detail-next').disabled=index===list.length-1;$('#detail-position').textContent=`${index+1} / ${list.length}`;
 }
 $('#close-word').addEventListener('click',()=>dialog.close());$('#detail-prev').addEventListener('click',()=>{if(index>0){index--;render();}});$('#detail-next').addEventListener('click',()=>{if(index<list.length-1){index++;render();}});
 dialog.addEventListener('click',event=>{const bounds=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))dialog.close();});
 dialog.addEventListener('close',()=>cancelDutchSpeech());
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'&&index>0){event.preventDefault();index--;render();}if(event.key==='ArrowRight'&&index<list.length-1){event.preventDefault();index++;render();}});
 return {open(word,words){list=words;index=list.findIndex(item=>item.id===word.id);render();dialog.showModal();},refresh(){if(dialog.open)render();}};
}
