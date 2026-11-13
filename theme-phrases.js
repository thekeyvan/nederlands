import {phrases,dialogues} from './phrase-data.js';
import {translationElement,t} from './i18n.js';
const element=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;node.textContent=text;return node;};
function meaning(text){const details=element('details','phrase-translation','');details.append(element('summary','','Toon de betekenis'),translationElement('p',text));return details;}
export function renderThemePhrases(theme,onPractice,onReviewTheme) {
 document.querySelector('#phrase-theme-title').textContent=`Handige zinnen: ${theme.title}.`;
 const cards=phrases.filter(card=>card.themeId===theme.id);
 document.querySelector('#theme-phrase-count').textContent=`${cards.length} zinnen · A2–B1`;
 document.querySelector('#theme-phrases').replaceChildren(...cards.map(card=>{
  const article=element('article','phrase-card','');const top=element('div','phrase-card-top','');top.append(element('span','pill',card.level));
  const button=element('button','text-link','Oefen deze zin ↗');button.addEventListener('click',()=>onPractice(card));top.append(button);
  article.append(top,element('p','phrase-dutch',card.nl),meaning(card.meaning));return article;
 }));
 document.querySelector('#practice-theme-phrases').onclick=()=>onReviewTheme(cards);
 const dialogue=dialogues.find(item=>item.themeId===theme.id),list=document.querySelector('#theme-dialogue');
 list.replaceChildren(...dialogue.lines.map(line=>{const li=element('li','dialogue-line','');li.dataset.speaker=line.speaker==='Jij'?'you':'other';li.append(element('span','dialogue-speaker',line.speaker),element('p','',line.nl),meaning(line.translation));return li;}));
 document.querySelector('#phrase-hint').replaceChildren(translationElement('p',t('phraseHint')));
}
