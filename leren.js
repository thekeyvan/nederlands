import {initTranslations} from './i18n.js';
import {themes} from './learning-data.js';
import {subscribe} from './progress-store.js';
import {createDiscovery} from './discovery.js';
import {createReview} from './review-ui.js';
import {createDashboard} from './learning-dashboard.js';
import {createWordDialog} from './word-dialog.js';
import {initGrammar} from './grammar-ui.js';
import {$,hydrateIcons,toast} from './ui.js';
initTranslations();hydrateIcons();
const panels=['vandaag','woorden','zinnen','oefenen','voortgang'];
let applying=false;
function navigate(panel,{theme=null,replace=false}={}){
 const url=new URL(location.href);url.hash=panel;if(theme)url.searchParams.set('thema',theme);else url.searchParams.delete('thema');
 history[replace?'replaceState':'pushState'](null,'',url);applyLocation(true);
}
function openTheme(id){navigate('woorden',{theme:id});}
const review=createReview({onEnter:()=>navigate('oefenen'),onOpenTheme:openTheme});
const wordDialog=createWordDialog(card=>review.practice(card));
const discovery=createDiscovery({onOpen:openTheme,onPractice:card=>review.practice(card),onPracticeTheme:(theme,type)=>review.start({theme,type}),wordDialog});
const dashboard=createDashboard({onOpenTheme:openTheme,onQuickStart:theme=>review.start({theme,type:'all',limit:5})});
initGrammar(card=>review.practice(card));
function applyLocation(moveFocus=false){
 if(applying)return;if(['#bronnen','#week'].includes(location.hash)){location.replace(`./bronnen.html${location.hash}`);return;}applying=true;
 let panel=location.hash.slice(1);const id=new URLSearchParams(location.search).get('thema');const legacy=panel==='thema-zinnen';if(legacy)panel='woorden';if(!panels.includes(panel))panel=id?'woorden':'vandaag';
 document.querySelectorAll('.app-panel').forEach(section=>section.hidden=section.id!==`panel-${panel}`);
 document.querySelectorAll('[data-panel]').forEach(link=>{if(link.dataset.panel===panel)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 if(panel==='woorden'){if(id&&themes.some(theme=>theme.id===id)){if(discovery.current()!==id)discovery.openTheme(id,legacy?'phrases':'words');}else discovery.showLibrary();}
 document.title=`${({vandaag:'Vandaag',woorden:'Thema’s',zinnen:'Zinsbouw',oefenen:'Oefenen',voortgang:'Voortgang'})[panel]} — Mijn Nederlands`;
 if(moveFocus){window.scrollTo({top:0,behavior:'instant'});const heading=[...document.querySelectorAll(`#panel-${panel} h1`)].find(heading=>!heading.closest('[hidden]'));if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
 window.speechSynthesis?.cancel();document.querySelector('.mobile-more')?.removeAttribute('open');applying=false;
}
document.querySelectorAll('[data-panel]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();navigate(link.dataset.panel);}));
$('#back-themes').addEventListener('click',()=>openTheme(null));window.addEventListener('popstate',()=>applyLocation(true));window.addEventListener('hashchange',()=>applyLocation());
subscribe(()=>{dashboard.update();discovery.renderLibrary();discovery.renderWords();wordDialog.refresh();});
window.addEventListener('learning-storage-error',()=>toast('Je browser kan je voortgang niet bewaren.'));
window.addEventListener('auth-message',event=>toast(event.detail));
dashboard.update();applyLocation();
import('./cloud.js').then(module=>module.initCloud()).catch(()=>{document.querySelectorAll('[data-sign-in]').forEach(button=>button.disabled=true);$('#sync-status').textContent='Inloggen is nu niet beschikbaar. Je kunt lokaal oefenen.';});
