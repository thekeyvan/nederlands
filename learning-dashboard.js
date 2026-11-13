import {themes} from './learning-data.js';
import {getProgress} from './progress-store.js';
import {progressStatus,ratings} from './srs.js';
import {cards,activity,resumeTheme,themeStats} from './learning-model.js';
import {themeCard} from './theme-cards.js';
import {$,el,icon,translated,button} from './ui.js';
export function createDashboard({onOpenTheme,onQuickStart}){
 let suggested='werk';
 $('#quick-start').addEventListener('click',()=>{const due=Object.values(getProgress().reviews).some(review=>new Date(review.due)<=new Date());onQuickStart(due?'all':suggested);});$('#continue-button').addEventListener('click',()=>onOpenTheme(suggested));$('#all-themes').addEventListener('click',()=>onOpenTheme(null));$('#show-all-progress').addEventListener('change',renderProgress);
 function update(){
  const {reviews,events}=getProgress(),today=activity(events).today,due=Object.values(reviews).filter(review=>new Date(review.due)<=new Date()).length;
  suggested=events.length?resumeTheme(events):'huisarts';const theme=themes.find(theme=>theme.id===suggested);
  $('#daily-title').replaceChildren(document.createTextNode(due?'Klaar voor een herhaling?':'Even oefenen.'),el('br'),document.createTextNode(due?'Je weet meer dan je denkt.':'Langer onthouden.'));
  $('#daily-copy').textContent=due?`${due} ${due===1?'kaartje wacht':'kaartjes wachten'} op je. Een klein rondje is genoeg om weer te beginnen.`:'Een paar woorden en zinnen. Eerst zelf denken, dan het antwoord bekijken.';
  $('#daily-count').textContent=`${today} ${today===1?'kaartje':'kaartjes'} vandaag`;$('#today-goal-count').textContent=`${Math.min(today,5)} / 5`;$('#today-progress').value=Math.min(today,5);$('#today-goal-copy').textContent=today>=5?'Je kleine stap van vandaag is gezet.':'Jouw doel: 5 kaartjes vandaag';
  $('#continue-theme').replaceChildren(el('h2','',theme.title),translated(theme.meaning),el('p','continue-description',events.length?'Ga verder waar je gebleven was.':theme.intro));$('.continue-top .eyebrow').textContent=events.length?'GA VERDER MET':'EEN GOEDE PLEK OM TE BEGINNEN';$('#continue-button').firstChild.textContent=events.length?'Verder met dit thema':'Ontdek dit thema';
  $('#due-count').textContent=due?String(due):'';
  const ids=[suggested,'reizen','werk','wonen','uitgaan','contact'];const recommended=[...new Set(ids)].map(id=>themes.find(theme=>theme.id===id));if(recommended.length<6)recommended.push(themes.find(theme=>!ids.includes(theme.id)));
  $('#recommended-themes').replaceChildren(...recommended.slice(0,6).map(theme=>themeCard(theme,reviews,onOpenTheme)));renderProgress();
 }
 function renderProgress(){
  const {reviews,events}=getProgress(),due=Object.values(reviews).filter(review=>new Date(review.due)<=new Date()).length;
  const stats=[['Geoefende kaartjes',Object.keys(reviews).length],['Goed onthouden',Object.values(reviews).filter(review=>progressStatus(review)==='known').length],['Aan het leren',Object.values(reviews).filter(review=>progressStatus(review)==='learning').length],['Vandaag herhalen',due]];
  $('#progress-stats').replaceChildren(...stats.map(([label,count])=>{const stat=el('div','stat-card');stat.append(el('strong','',String(count)),el('span','',label));return stat;}));
  const week=activity(events).week,max=Math.max(5,...week.map(day=>day.count));$('#week-activity').replaceChildren(...week.map(day=>{const column=el('div','activity-day'),bar=el('div','activity-bar'),fill=el('span');fill.style.height=`${day.count/max*100}%`;bar.append(fill);bar.setAttribute('aria-hidden','true');column.append(el('strong','',String(day.count)),bar,el('span','',day.label));column.setAttribute('aria-label',`${day.date.toLocaleDateString('nl-NL')}: ${day.count} kaartjes`);return column;}));
  const started=[...themes,{id:'zinsbouw',title:'Zinsbouw'}].filter(theme=>$('#show-all-progress').checked||themeStats(theme.id,reviews).done);
  $('#theme-progress').replaceChildren(...started.map(theme=>{const stats=themeStats(theme.id,reviews),row=el('div','theme-progress-row'),text=el('div'),progress=el('progress');text.append(el('span','',theme.title),el('small','',`${stats.done}/${stats.total} · ${stats.known} onthouden`));progress.max=stats.total;progress.value=stats.done;progress.setAttribute('aria-label',`${theme.title}: ${stats.done} van ${stats.total} geoefend`);row.append(text,progress);return row;}));
  if(!started.length)$('#theme-progress').append(el('p','progress-empty','Nog een leeg begin. Na je eerste kaartje zie je hier je voortgang.'));
  $('#recent-reviews').replaceChildren(...events.slice(-6).reverse().map(event=>{const card=cards.find(card=>card.id===event.cardId),row=el('div','recent-review');row.append(el('span','',card?.nl||card?.title||event.cardId),el('small','',`${ratings.find(rating=>rating.grade===event.grade)?.label} · ${new Date(event.at).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}`));return row;}));
  if(!events.length)$('#recent-reviews').append(el('p','progress-empty','Hier komen je laatste oefeningen. Begin met een klein rondje.'));
 }
 return {update};
}
