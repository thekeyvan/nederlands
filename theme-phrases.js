import {phrases,dialogues} from './phrase-data.js';
import {$,el,button,translated,listenButton} from './ui.js';
function meaning(text){const details=el('details','phrase-translation');details.append(el('summary','','Toon de betekenis'),translated(text));return details;}
export function renderThemePhrases(theme,onPractice,onReviewTheme){
 const cards=phrases.filter(card=>card.themeId===theme.id);$('#theme-phrase-count').textContent=`${cards.length} handige zinnen voor dit thema.`;
 $('#theme-phrases').replaceChildren(...cards.map(card=>{const article=el('article','phrase-card'),top=el('div','phrase-card-top'),actions=el('div','phrase-card-actions');actions.append(listenButton(card.nl),button('Oefenen',()=>onPractice(card),'text-action'));top.append(el('span','pill',card.level),actions);article.append(top,el('p','phrase-dutch',card.nl),meaning(card.meaning));return article;}));
 $('#practice-theme-phrases').onclick=onReviewTheme;const toggle=$('#toggle-phrase-translations');toggle.textContent='Toon vertalingen';toggle.setAttribute('aria-pressed','false');toggle.onclick=()=>{const show=toggle.getAttribute('aria-pressed')!=='true';toggle.setAttribute('aria-pressed',String(show));toggle.textContent=show?'Verberg vertalingen':'Toon vertalingen';$('#theme-phrases').querySelectorAll('details').forEach(details=>details.open=show);};
 const dialogue=dialogues.find(item=>item.themeId===theme.id);$('#theme-dialogue').replaceChildren(...dialogue.lines.map(line=>{
  const li=el('li','dialogue-line');li.dataset.speaker=line.speaker==='Jij'?'you':'other';li.append(el('span','dialogue-speaker',line.speaker),el('p','dialogue-dutch',line.nl),listenButton(line.nl),meaning(line.translation));const reveal=button('Wat zeg jij? Toon jouw zin',()=>{li.classList.remove('is-hidden');reveal.hidden=true;},'roleplay-reveal');reveal.hidden=true;li.append(reveal);return li;
 }));
 const roleplay=$('#roleplay-toggle');roleplay.setAttribute('aria-pressed','false');roleplay.textContent='Verberg mijn zinnen';roleplay.onclick=()=>{const hidden=roleplay.getAttribute('aria-pressed')!=='true';roleplay.setAttribute('aria-pressed',String(hidden));roleplay.textContent=hidden?'Toon mijn zinnen':'Verberg mijn zinnen';document.querySelectorAll('.dialogue-line[data-speaker=you]').forEach(line=>{line.classList.toggle('is-hidden',hidden);line.querySelector('.roleplay-reveal').hidden=!hidden;});};
}
