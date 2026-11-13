import {vocabulary} from './learning-data.js';
import {phrases} from './phrase-data.js';
import {themeMeta,themeStats} from './learning-model.js';
import {el,icon,translated} from './ui.js';
export function themeCard(theme,reviews,onOpen){
 const meta=themeMeta(theme),stats=themeStats(theme.id,reviews),card=el('a','theme-card');card.dataset.color=meta.color;card.href=`./leren.html?thema=${encodeURIComponent(theme.id)}#woorden`;
 const top=el('div','theme-card-top'),symbol=el('span','theme-symbol');symbol.append(icon(meta.icon));top.append(symbol,el('span','',stats.done?'Al begonnen':'A2–B1'));
 const bottom=el('div','theme-card-bottom');bottom.append(el('span','',`${vocabulary.filter(word=>word.themeId===theme.id).length} woorden · ${phrases.filter(phrase=>phrase.themeId===theme.id).length} zinnen`),icon('arrow-right'));
 card.append(top,el('h3','',theme.title),translated(theme.meaning),bottom);
 if(stats.done){const progress=el('progress');progress.max=stats.total;progress.value=stats.done;progress.setAttribute('aria-label',`${stats.done} van ${stats.total} geoefend`);card.append(progress);}
 card.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();onOpen(theme.id);});return card;
}
