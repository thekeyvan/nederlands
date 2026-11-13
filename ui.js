import {translationElement} from './i18n.js';
if('speechSynthesis' in window)window.speechSynthesis.getVoices();
export const $=selector=>document.querySelector(selector);
export function el(tag,className='',text=''){const node=document.createElement(tag);node.className=className;node.textContent=text;return node;}
export const translated=(text,className='')=>translationElement('p',text,className);
export function icon(name){const node=el('span','icon');node.style.setProperty('--icon',`url("./assets/icons/${name}.svg")`);node.setAttribute('aria-hidden','true');return node;}
export function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(node=>node.replaceWith(icon(node.dataset.icon)));}
export function button(text,onClick,className='button secondary',iconName){const node=el('button',className,text);node.type='button';if(iconName)node.append(icon(iconName));node.addEventListener('click',onClick);return node;}
export function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,4500);}
export function tabs(selector,onSelect){
 const buttons=[...document.querySelectorAll(selector)];
 buttons.forEach((button,index)=>{button.addEventListener('click',()=>onSelect(button));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%buttons.length;else if(event.key==='ArrowLeft')next=(index-1+buttons.length)%buttons.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=buttons.length-1;else return;event.preventDefault();buttons[next].focus();onSelect(buttons[next]);});});
}
export function listenButton(text){
 const node=button('Luister',()=>speak(text),'listen-button','volume-2');node.setAttribute('aria-label',`Luister: ${text}`);node.hidden=!('speechSynthesis' in window);return node;
}
export function speak(text){
 const synth=window.speechSynthesis;if(!synth)return;
 const voice=synth.getVoices().find(voice=>voice.lang.toLowerCase().startsWith('nl'));
 if(!voice){toast('Er is geen Nederlandse stem beschikbaar op dit apparaat.');return;}
 synth.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='nl-NL';utterance.voice=voice;utterance.rate=.85;
 utterance.onerror=event=>{if(!['interrupted','canceled'].includes(event.error))toast('Voorlezen lukt nu niet op dit apparaat.');};synth.speak(utterance);
}
