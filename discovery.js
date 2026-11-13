import {themes,vocabulary,searchVocabulary} from './learning-data.js';
import {phrases} from './phrase-data.js';
import {getProgress} from './progress-store.js';
import {progressStatus} from './srs.js';
import {locale} from './i18n.js';
import {themeMeta} from './learning-model.js';
import {themeCard} from './theme-cards.js';
import {renderThemePhrases} from './theme-phrases.js';
import {$,el,icon,translated,tabs} from './ui.js';
export function createDiscovery({onOpen,onPractice,onPracticeTheme,wordDialog}){
 let active=null,group='all',view='cards',page=0,topic='words';
 const positions=[[10,15],[30,9],[50,12],[70,9],[90,15],[10,50],[90,50],[10,85],[30,91],[50,88],[70,91],[90,85]];
 for(const[x,y]of positions){const line=document.createElementNS('http://www.w3.org/2000/svg','line');for(const [key,value]of Object.entries({x1:500,y1:300,x2:x*10,y2:y*6}))line.setAttribute(key,String(value));$('.web-lines').append(line);}
 function renderLibrary(){
  const query=$('#theme-search').value.trim().toLocaleLowerCase();const visible=themes.filter(theme=>(group==='all'||themeMeta(theme).group===group)&&`${theme.title} ${theme.meaning} ${theme.intro}`.toLocaleLowerCase().includes(query));
  $('#all-theme-grid').replaceChildren(...visible.map(theme=>themeCard(theme,getProgress().reviews,onOpen)));$('#theme-result').textContent=`${visible.length} ${visible.length===1?'thema':'thema’s'} om te ontdekken`;$('#theme-empty').hidden=visible.length>0;
 }
 function setTopic(value){
  topic=value;document.querySelectorAll('[data-topic]').forEach(tab=>{const selected=tab.dataset.topic===topic;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
  for(const id of ['words','phrases','dialogue'])$(`#topic-${id}`).hidden=id!==topic;
 }
 function openTheme(id,subtopic='words'){
  active=themes.find(theme=>theme.id===id);if(!active)return;
  $('#panel-woorden').setAttribute('aria-labelledby','workspace-title');$('#theme-library').hidden=true;$('#theme-workspace').hidden=false;$('#theme-workspace').dataset.color=themeMeta(active).color;
  $('#workspace-title').textContent=active.title;$('#theme-group-label').textContent=themeMeta(active).label;$('#workspace-icon').replaceChildren(icon(themeMeta(active).icon));
  const translation=$('#workspace-translation');translation.textContent=active.meaning;translation.lang=locale.code;translation.dir=locale.dir;
  $('#map-intro').textContent=active.intro;$('#topic-word-count').textContent=vocabulary.filter(card=>card.themeId===id).length;$('#topic-phrase-count').textContent=phrases.filter(card=>card.themeId===id).length;
  $('#word-search').value='';$('#kind-select').value='all';page=0;renderWords();renderThemePhrases(active,onPractice,()=>onPracticeTheme(active.id,'praktisch'));setTopic(subtopic);
 }
 function renderWords(){
  if(!active)return;
  const query=$('#word-search').value;const words=searchVocabulary(query,query.trim()?'all':active.id,$('#kind-select').value);const pages=Math.max(1,Math.ceil(words.length/12));page=Math.max(0,Math.min(page,pages-1));
  const visible=words.slice(page*12,page*12+12);$('#word-result').textContent=`${words.length} ${words.length===1?'woord':'woorden & uitdrukkingen'}${query.trim()?' · uit alle thema’s':' · klik op een kaartje'}`;
  $('#word-cards').replaceChildren(...visible.map(word=>{
   const card=el('button','word-card');card.append(el('span','word-kind',query.trim()?word.themeTitle:word.kind),el('strong','',word.nl));const state=el('span','word-state');state.dataset.state=progressStatus(getProgress().reviews[word.id]);state.setAttribute('aria-label',({new:'Nieuw',known:'Goed onthouden',learning:'Aan het leren'})[state.dataset.state]);const arrow=icon('arrow-right');arrow.classList.add('open-word');card.append(state,arrow,translated(word.meaning,'hover-meaning'));card.setAttribute('aria-label',`${word.nl} — bekijk betekenis en voorbeeld`);card.addEventListener('click',()=>wordDialog.open(word,words));return card;
  }));
  $('#web-title').textContent=query.trim()?'Gevonden woorden':active.title;$('#web-translation').replaceChildren(translated(query.trim()?'':active.meaning));
  $('#web-nodes').replaceChildren(...visible.map((word,index)=>{const card=el('button','web-node',word.nl);card.style.left=`${positions[index][0]}%`;card.style.top=`${positions[index][1]}%`;card.title=word.meaning;card.addEventListener('click',()=>wordDialog.open(word,words));return card;}));
  $('#word-cards').hidden=view!=='cards'||!words.length;$('#wordweb').hidden=view!=='web'||!words.length;$('#word-empty').hidden=words.length>0;$('#word-pagination').hidden=pages<=1;$('#words-page').textContent=`${page+1} / ${pages}`;$('#words-prev').disabled=page===0;$('#words-next').disabled=page===pages-1;
 }
 $('#theme-search').addEventListener('input',renderLibrary);document.querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>{group=button.dataset.group;document.querySelectorAll('[data-group]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));renderLibrary();}));
 $('#reset-theme-search').addEventListener('click',()=>{$('#theme-search').value='';document.querySelector('[data-group=all]').click();});
 $('#word-search').addEventListener('input',()=>{page=0;renderWords();});$('#kind-select').addEventListener('change',()=>{page=0;renderWords();});$('#reset-word-search').addEventListener('click',()=>{$('#word-search').value='';$('#kind-select').value='all';renderWords();$('#word-search').focus();});
 $('#words-prev').addEventListener('click',()=>{page--;renderWords();});$('#words-next').addEventListener('click',()=>{page++;renderWords();});
 for(const id of ['cards','web'])$(`#view-${id}`).addEventListener('click',()=>{view=id;$('#view-cards').setAttribute('aria-pressed',String(view==='cards'));$('#view-web').setAttribute('aria-pressed',String(view==='web'));renderWords();});
 tabs('[data-topic]',button=>setTopic(button.dataset.topic));$('#practice-theme').addEventListener('click',()=>active&&onPracticeTheme(active.id,'all'));
 return {openTheme,renderLibrary,renderWords,current:()=>active?.id,showLibrary(){active=null;$('#panel-woorden').setAttribute('aria-labelledby','discover-title');$('#theme-library').hidden=false;$('#theme-workspace').hidden=true;renderLibrary();}};
}
