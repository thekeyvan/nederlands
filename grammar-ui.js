import {sentences} from './sentence-data.js';
import {$,el,button,translated,listenButton} from './ui.js';
export function initGrammar(onPractice){
 function render(){
  const query=$('#grammar-search').value.trim().toLocaleLowerCase();const visible=sentences.filter(sentence=>`${sentence.title} ${sentence.pattern} ${sentence.example} ${sentence.rule} ${sentence.note}`.toLocaleLowerCase().includes(query));
  $('#sentence-grid').replaceChildren(...visible.map(sentence=>{
   const card=el('details','sentence-card'),summary=el('summary');summary.append(el('span','pill',sentence.level),el('strong','',sentence.title));
   const quote=el('blockquote','',sentence.example);quote.lang='nl';card.append(summary,translated(sentence.rule),el('p','pattern',sentence.pattern),quote,listenButton(sentence.example),translated(sentence.translation),translated(sentence.note,'sentence-note'),button('Probeer deze zin',()=>onPractice({...sentence,themeId:'zinsbouw'}),'text-action','arrow-right'));return card;
  }));$('#grammar-empty').hidden=visible.length>0;
 }
 $('#grammar-search').addEventListener('input',render);render();
}
