import {phrases} from './phrase-data.js';
import {renderThemePhrases} from './theme-phrases.js';
import {t,locale,translationElement,initTranslations} from './i18n.js';
import {themes,vocabulary,searchVocabulary} from './learning-data.js';
import {sentences} from './sentence-data.js';
import {ratings,scheduleReview,progressStatus,makeQueue} from './srs.js';
import {getProgress,reviewCard,subscribe} from './progress-store.js';
const $=selector=>document.querySelector(selector);
const node=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text)e.textContent=text;return e;};
const translated=(text,className='')=>translationElement('p',text,className);
initTranslations();
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,3500);}
const cardList=[...vocabulary,...phrases,...sentences.map(s=>({...s,themeId:'zinsbouw'}))];
const labels={new:'Nog niet geoefend',learning:'Aan het leren',known:'Goed onthouden'};
for(const theme of themes){const option=node('option','',theme.title);option.value=theme.id;$('#review-theme').append(option);}
const grammarOption=node('option','','Zinsbouw');grammarOption.value='zinsbouw';$('#review-theme').append(grammarOption);
let page=0,themeId=new URLSearchParams(location.search).get('thema')||'werk',selectedId=null,queue=[],queueIndex=0,reviewRevealed=false;
if(!themes.some(t=>t.id===themeId))themeId='werk';
function showPanel(name){
 if(!['woorden','zinnen','oefenen','voortgang'].includes(name))name='woorden';
 document.querySelectorAll('[role=tabpanel]').forEach(e=>e.hidden=e.id!==`panel-${name}`);
 document.querySelectorAll('[role=tab]').forEach(e=>{const selected=e.dataset.panel===name;e.setAttribute('aria-selected',String(selected));e.tabIndex=selected?0:-1;});
 history.replaceState(null,'',`${location.pathname}${location.search}#${name}`);
 if(name==='voortgang')renderProgress();
 if(name==='oefenen')$('#panel-oefenen').scrollIntoView({behavior:'smooth',block:'start'});
}
document.querySelectorAll('[role=tab]').forEach((tab,index,all)=>{
 tab.addEventListener('click',()=>showPanel(tab.dataset.panel));
 tab.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%all.length;else if(event.key==='ArrowLeft')next=(index-1+all.length)%all.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=all.length-1;else return;event.preventDefault();all[next].focus();showPanel(all[next].dataset.panel);});
});
for(const theme of themes){const option=node('option','',theme.title);option.value=theme.id;$('#theme-select').append(option);}$('#theme-select').value=themeId;
const positions=[[10,15],[30,9],[50,12],[70,9],[90,15],[10,50],[90,50],[10,85],[30,91],[50,88],[70,91],[90,85]];
const svg=$('.web-lines');for(const[x,y]of positions){const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1','500');line.setAttribute('y1','300');line.setAttribute('x2',String(x*10));line.setAttribute('y2',String(y*6));svg.append(line);}
function renderWords(){
 const theme=themes.find(t=>t.id===themeId),query=$('#word-search').value,kind=$('#kind-select').value;
 const words=searchVocabulary(query,query.trim()?'all':themeId,kind);const pages=Math.max(1,Math.ceil(words.length/12));page=Math.min(page,pages-1);
 $('#web-title').textContent=query.trim()?'Gevonden woorden':theme.title;$('#web-translation').replaceChildren(translationElement('span',query.trim()?t('searchResult'):theme.meaning));
 $('#map-intro').textContent=query.trim()?'Zoeken in alle thema’s.':theme.intro;$('#word-result').textContent=`${words.length} woorden & uitdrukkingen`;
 const fragment=document.createDocumentFragment();
 words.slice(page*12,page*12+12).forEach((word,index)=>{
  const button=node('button','web-node');button.dataset.kind=word.kind;button.style.left=`${positions[index][0]}%`;button.style.top=`${positions[index][1]}%`;
  button.append(node('span','',word.nl));const meaning=translated(word.meaning,'node-meaning');meaning.id=`meaning-${word.id}`;button.append(meaning);
  button.setAttribute('aria-describedby',meaning.id);button.setAttribute('aria-pressed',String(word.id===selectedId));
  button.addEventListener('click',()=>{selectedId=word.id;renderDetail(word);document.querySelectorAll('.web-node').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(matchMedia('(max-width:700px)').matches)$('#word-detail').scrollIntoView({behavior:'smooth',block:'start'});});fragment.append(button);
 });
 renderThemePhrases(theme,practiceCard,cards=>{$('#review-type').value='praktisch';$('#review-theme').value=theme.id;queue=makeQueue(cards,getProgress().reviews);queueIndex=0;showPanel('oefenen');renderReview();});
 $('#web-nodes').replaceChildren(fragment);$('#words-page').textContent=`${page+1} / ${pages}`;$('#words-prev').disabled=page===0;$('#words-next').disabled=page===pages-1;$('#word-empty').hidden=words.length!==0;$('.word-workspace').hidden=words.length===0;
}
function renderDetail(word){
 const aside=$('#word-detail'),status=progressStatus(getProgress().reviews[word.id]);const badge=node('span','word-status',labels[status]);badge.dataset.status=status;
 aside.replaceChildren(node('p','eyebrow',`${word.kind.toUpperCase()} · ${word.themeTitle}`),node('h3','',word.nl),translated(word.meaning,'meaning'),badge);
 if(word.forms){const forms=node('dl','verb-forms');for(const[label,value]of [['Infinitief',word.nl],['Imperfectum',word.forms[0]],['Perfectum',word.forms[1]],['Vorm',word.forms[2]]]){const row=node('div');row.append(node('dt','',label),node('dd','',value));forms.append(row);}aside.append(forms);}
 if(word.example){const example=node('div','word-example');example.append(node('p','nl-example',word.example),translated(word.translation));aside.append(example);}
 if(word.nl.length>21&&!word.example){aside.append(translated(t('readSlowly'),'tiny'));}
 const practice=node('button','button dark','Oefen dit kaartje ↗');practice.addEventListener('click',()=>practiceCard(word));aside.append(practice);
}
function practiceCard(card){$('#review-theme').value=card.themeId;$('#review-type').value=card.id.startsWith('phrase:')?'praktisch':'woorden';queue=[card];queueIndex=0;showPanel('oefenen');renderReview();}
$('#theme-select').addEventListener('change',()=>{themeId=$('#theme-select').value;const url=new URL(location.href);url.searchParams.set('thema',themeId);history.replaceState(null,'',url);page=0;selectedId=null;$('#word-detail').replaceChildren(node('h3','','Kies een woord'),node('p','','Klik op een woord voor de betekenis.'));$('#word-search').value='';renderWords();});
$('#word-search').addEventListener('input',()=>{page=0;renderWords();});$('#kind-select').addEventListener('change',()=>{page=0;renderWords();});
$('#words-prev').addEventListener('click',()=>{page--;renderWords();});$('#words-next').addEventListener('click',()=>{page++;renderWords();});
for(const sentence of sentences){
 const card=node('details','sentence-card'),summary=node('summary');summary.append(node('span','pill',sentence.level),node('strong','',sentence.title));
 const practice=node('button','text-link','Oefen deze zin ↗');practice.addEventListener('click',()=>{queue=[{...sentence,themeId:'zinsbouw'}];queueIndex=0;showPanel('oefenen');renderReview();});
 const quote=node('blockquote','',sentence.example);quote.lang='nl';card.append(summary,translated(sentence.rule),node('p','pattern',sentence.pattern),quote,translated(sentence.translation),translated(sentence.note,'sentence-note'),practice);$('#sentence-grid').append(card);
}
function startReview(){const type=$('#review-type').value;const pool=type==='woorden'?vocabulary:type==='praktisch'?phrases:type==='zinnen'?cardList.filter(c=>c.themeId==='zinsbouw'):cardList;queue=makeQueue(pool,getProgress().reviews,{theme:$('#review-theme').value});queueIndex=0;renderReview();}
$('#review-start').addEventListener('click',startReview);
function renderReview(){
 reviewRevealed=false;const area=$('#review-area');
 if(queueIndex>=queue.length){area.replaceChildren(node('p','eyebrow',queue.length?'GOED GEOEFEND':'ALLES VOOR NU'),node('h3','',queue.length?`${queue.length} kaartjes geoefend.`:'Je hebt nu geen kaartjes klaarstaan.'),translated(t('queueDone')));updateDue();return;}
 const card=queue[queueIndex],isSentence=card.id.startsWith('zin:'),reverse=$('#review-direction').value==='local-nl'&&!isSentence;
 const top=node('div','review-progress');top.append(node('span','',isSentence?'ZINSBOUW':card.themeTitle),node('span','',`${queueIndex+1} / ${queue.length}`));
 const question=reverse?translated(card.meaning,'review-question'):node('p','review-question',isSentence?card.prompt:card.nl);
 const hint=translated(isSentence?t('grammarHint'):reverse?t('reverseHint'):t('meaningHint'));
 const reveal=node('button','button dark','Toon het antwoord');reveal.id='reveal-answer';reveal.addEventListener('click',()=>revealAnswer(card,reverse));
 area.replaceChildren(top,question,hint,reveal);
}
function revealAnswer(card,reverse){
 if(reviewRevealed)return;reviewRevealed=true;$('#reveal-answer').remove();const answer=node('div','review-answer');
 if(card.id.startsWith('zin:'))answer.append(node('p','nl-answer',card.answer),node('p','answer-example',card.example),translated(card.translation),translated(card.rule,'answer-note'));
 else{answer.append(reverse?node('p','nl-answer',card.nl):translated(card.meaning));if(card.example)answer.append(node('p','answer-example',card.example),translated(card.translation,'answer-note'));}
 const buttons=node('div','review-ratings');for(const rating of ratings){const next=scheduleReview(getProgress().reviews[card.id],rating.grade),button=node('button','',rating.label);button.append(translated(t(`rating${rating.grade}`)),node('small','',`over ${next.interval} ${next.interval===1?'dag':'dagen'}`));button.addEventListener('click',()=>{reviewCard(card.id,rating.grade);queueIndex++;renderReview();});buttons.append(button);}
 $('#review-area').append(answer,buttons);buttons.querySelector('button').focus();
}
function updateDue(){const reviews=getProgress().reviews;const now=new Date();const due=Object.values(reviews).filter(r=>new Date(r.due)<=now).length;$('#due-count').textContent=due?String(due):'';}
function renderProgress(){
 const {reviews,events}=getProgress(),now=new Date();const stats=[['Geoefende kaartjes',Object.keys(reviews).length],['Goed onthouden',Object.values(reviews).filter(r=>progressStatus(r)==='known').length],['Nog aan het leren',Object.values(reviews).filter(r=>progressStatus(r)==='learning').length],['Vandaag herhalen',Object.values(reviews).filter(r=>new Date(r.due)<=now).length]];
 $('#progress-stats').replaceChildren(...stats.map(([label,count])=>{const stat=node('div','stat-card');stat.append(node('strong','',String(count)),node('span','',label));return stat;}));
 $('#theme-progress').replaceChildren(...[...themes,{id:'zinsbouw',title:'Zinsbouw'}].map(theme=>{const cards=cardList.filter(c=>c.themeId===theme.id),done=cards.filter(c=>reviews[c.id]).length,known=cards.filter(c=>progressStatus(reviews[c.id])==='known').length;const row=node('div','theme-progress-row'),text=node('div');text.append(node('span','',theme.title),node('small','',`${done}/${cards.length} geoefend · ${known} onthouden`));const progress=node('progress');progress.max=cards.length;progress.value=done;progress.setAttribute('aria-label',`${theme.title}: ${done} van ${cards.length} geoefend`);row.append(text,progress);return row;}));
 $('#recent-reviews').replaceChildren(...events.slice(-12).reverse().map(event=>{const card=cardList.find(c=>c.id===event.cardId),row=node('div','recent-review');row.append(node('span','',card?.nl||card?.title||event.cardId),node('small','',`${ratings.find(r=>r.grade===event.grade)?.label} · ${new Date(event.at).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}`));return row;}));
 if(!events.length)$('#recent-reviews').append(node('p','progress-empty','Je hebt nog niet geoefend. Begin met een paar kaartjes.'));
}
subscribe(()=>{updateDue();renderProgress();if(selectedId){const word=vocabulary.find(w=>w.id===selectedId);if(word)renderDetail(word);}});
window.addEventListener('learning-storage-error',()=>toast('Je browser kan je voortgang niet bewaren.'));
window.addEventListener('auth-message',event=>toast(event.detail));
renderWords();updateDue();renderProgress();showPanel(location.hash.slice(1)||'woorden');
import('./cloud.js').then(module=>module.initCloud()).catch(()=>{document.querySelectorAll('[data-sign-in]').forEach(button=>{button.disabled=true;});$('#sync-status').textContent='Inloggen is nu niet beschikbaar. Je kunt op dit apparaat oefenen.';});
