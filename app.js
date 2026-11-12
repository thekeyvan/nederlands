import { resources, ideas, weekTasks, prompts } from './data.js';
import { loadState, matchingResources, weekKey } from './state.js';
const $ = selector => document.querySelector(selector);
const storage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value)
};
let state = loadState(storage, resources.map(resource => resource.id));
const filters = { category: 'start', level: 'all', query: '' };
const bookmarkIcon = '<svg viewBox="0 0 18 22" aria-hidden="true"><path d="M3 2h12v18l-6-4-6 4z"/></svg>';
const icons = {Luisteren:'◖',Lezen:'≡',Spreken:'“',Uitspraak:'Aa',Grammatica:'a→b',Schrijven:'↗',Woorden:'a',Boeken:'▤'};
let storageWarningShown = false;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => { $('#toast').hidden = true; }, 2500);
}
function save() {
  try { storage.setItem('mijn-nederlands-v1', JSON.stringify(state)); }
  catch { if (!storageWarningShown) { toast('Je browser kan je keuzes nu niet bewaren.'); storageWarningShown = true; } }
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function renderResources() {
  const selected = matchingResources(resources, filters, state.saved);
  $('#saved-count').textContent = state.saved.length;
  $('#result-count').textContent = `${selected.length} ${selected.length === 1 ? 'bron' : 'bronnen'}`;
  const notes = {
    start:'Zes fijne plekken om te beginnen. Je hoeft ze niet allemaal te gebruiken.',
    Boeken:'Eén goed boek is genoeg. Kies een hoofdboek dat bij je niveau past.',
    saved:'Jouw bewaarde bronnen. Klik op het bladwijzertje om iets te bewaren.',
    all:'De hele verzameling. Kies een vaardigheid of zoek iets dat je nodig hebt.'
  };
  $('#filter-note').textContent = notes[filters.category] || 'Kies één bron. Bij elke bron staat een korte opdracht.';
  const fragment = document.createDocumentFragment();
  for (const resource of selected) {
    const card = el('article','resource-card');
    const top = el('div','card-top');
    const icon = el('span','card-icon',icons[resource.categories[0]]);
    icon.setAttribute('aria-hidden','true');
    const bookmark = el('button','bookmark');
    bookmark.innerHTML = bookmarkIcon;
    bookmark.setAttribute('aria-label',`${state.saved.includes(resource.id) ? 'Verwijder' : 'Bewaar'} ${resource.name}`);
    bookmark.setAttribute('aria-pressed',String(state.saved.includes(resource.id)));
    bookmark.addEventListener('click',() => toggleSaved(resource.id, bookmark));
    top.append(icon,bookmark);
    const meta = el('div','card-meta',`${resource.categories[0]} · ${resource.level === 'A2' ? 'A2–B1' : 'B1+'} · ${resource.time}`);
    const title = el('h3','',resource.name);
    const description = el('p','',resource.description);
    const footer = el('div','card-footer');
    const details = el('button','', 'Zo kun je oefenen ↗');
    details.setAttribute('aria-label',`Zo kun je oefenen met ${resource.name}`);
    details.addEventListener('click',() => showDetails(resource));
    footer.append(details,el('span','cost',resource.cost));
    card.append(top,meta,title,description,footer);
    fragment.append(card);
  }
  $('#resource-grid').replaceChildren(fragment);
  $('#empty').hidden = selected.length !== 0;
  document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.category === filters.category)));
  document.querySelectorAll('[data-level]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.level === filters.level)));
}
function toggleSaved(id, button) {
  const wasSaved = state.saved.includes(id);
  state.saved = wasSaved ? state.saved.filter(value => value !== id) : [...state.saved,id];
  save();
  if (filters.category === 'saved') {
    renderResources();
    const remaining = $('#resource-grid .bookmark');
    (remaining || $('[data-category="saved"]')).focus();
  } else {
    const name = resources.find(resource => resource.id === id).name;
    button.setAttribute('aria-pressed',String(!wasSaved));
    button.setAttribute('aria-label',`${wasSaved ? 'Bewaar' : 'Verwijder'} ${name}`);
    $('#saved-count').textContent = state.saved.length;
  }
  toast(wasSaved ? 'Bron verwijderd uit Bewaard.' : 'Bron bewaard voor later.');
}
function showDetails(resource) {
  $('#detail-category').textContent = `${resource.categories.join(' / ')} · ${resource.level === 'A2' ? 'A2–B1' : 'B1+'}`;
  $('#detail-title').textContent = resource.name;
  $('#detail-description').textContent = resource.description;
  $('#detail-steps').replaceChildren(...resource.steps.map(step => el('li','',step)));
  $('#detail-note').replaceChildren(document.createTextNode(resource.note || ''));
  if (resource.alternate) {
    const alternate = el('a','',resource.alternate.label+' ↗');
    alternate.href=resource.alternate.url; alternate.target='_blank'; alternate.rel='noopener noreferrer';
    $('#detail-note').append(document.createElement('br'),alternate);
  }
  $('#detail-link').href = resource.url;
  $('#resource-dialog').showModal();
}
function selectCategory(category) {
  filters.category = category;
  filters.query=''; $('#search').value='';
  renderResources();
}
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click',() => selectCategory(button.dataset.category)));
document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click',() => { filters.level=button.dataset.level; renderResources(); }));
$('#search').addEventListener('input',event => {
  filters.query=event.target.value;
  if (filters.query.trim() && filters.category === 'start') filters.category='all';
  renderResources();
});
$('#clear-filters').addEventListener('click',() => { filters.level='all'; selectCategory('all'); });
$('#nav-saved').addEventListener('click',() => {
  filters.level='all'; selectCategory('saved');
  $('#bronnen').scrollIntoView({behavior:'smooth'});
});
$('#close-detail').addEventListener('click',() => $('#resource-dialog').close());
$('#close-session').addEventListener('click',() => $('#session-dialog').close());
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click',event => {
  const rect=dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)) dialog.close();
});
let ideaIndex = Math.floor(Date.now()/86400000) % ideas.length;
function renderIdea() {
  const idea=ideas[ideaIndex];
  $('#daily-title').textContent=idea.title;
  $('#daily-description').textContent=idea.description;
  $('#daily-type').textContent=idea.type;
  $('#daily-link').href=resources.find(resource => resource.id===idea.resource).url;
}
$('#next-idea').addEventListener('click',() => { ideaIndex=(ideaIndex+1)%ideas.length; renderIdea(); });
function renderWeek() {
  const currentWeek = weekKey();
  if (state.week!==currentWeek) { state.week=currentWeek; state.done=[]; save(); }
  const tasks=weekTasks.map(task => {
    const label=el('label','week-item');
    const input=el('input'); input.type='checkbox'; input.checked=state.done.includes(task.id);
    input.setAttribute('aria-label',task.title);
    const mark=el('span','checkmark',input.checked ? '✓' : ''); mark.setAttribute('aria-hidden','true');
    input.addEventListener('change',() => {
      if (state.week!==weekKey()) { state.week=weekKey(); state.done=[]; }
      state.done=input.checked ? [...new Set([...state.done,task.id])] : state.done.filter(id => id!==task.id);
      mark.textContent=input.checked ? '✓' : '';
      save(); updateWeekProgress();
    });
    label.append(input,mark,el('span','week-time',task.time),el('strong','',task.title),el('span','task-copy',task.copy));
    return label;
  });
  $('#week-list').replaceChildren(...tasks); updateWeekProgress();
}
function updateWeekProgress() { $('#week-count').textContent=`${state.done.length} / 5`; $('#week-progress').value=state.done.length; }
$('#reset-week').addEventListener('click',() => { state.done=[]; save(); renderWeek(); toast('Je kunt opnieuw beginnen.'); });
document.addEventListener('visibilitychange',() => { if (!document.hidden && state.week!==weekKey()) renderWeek(); });
let promptIndex=0;
$('#next-prompt').addEventListener('click',() => { promptIndex=(promptIndex+1)%prompts.length; $('#speaking-prompt').textContent=prompts[promptIndex]; });
let remaining=20*60, deadline=null, timerInterval=null;
function renderTimer() {
  if (deadline!==null) remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));
  $('#timer').textContent=`${Math.floor(remaining/60).toString().padStart(2,'0')}:${(remaining%60).toString().padStart(2,'0')}`;
  document.title=deadline!==null ? `${$('#timer').textContent} · Mijn Nederlands` : 'Mijn Nederlands — elke dag een beetje';
  if (remaining===0 && deadline!==null) {
    deadline=null; clearInterval(timerInterval);
    $('#timer-toggle').textContent='Nog een keer';
    $('#timer-status').textContent='Klaar! Vertel in drie zinnen wat je hebt geleerd.';
    toast('Je 20 minuten zijn klaar. Goed geoefend.');
  }
}
$('#start-session').addEventListener('click',() => $('#session-dialog').showModal());
$('#timer-toggle').addEventListener('click',() => {
  if (deadline!==null) {
    renderTimer(); deadline=null; clearInterval(timerInterval);
    $('#timer-toggle').textContent='Ga verder'; document.title='Mijn Nederlands — elke dag een beetje';
  } else {
    if (remaining===0) remaining=1200;
    deadline=Date.now()+remaining*1000;
    $('#timer-toggle').textContent='Pauze';
    $('#timer-status').textContent='De timer blijft lopen als je de bron in een nieuw tabblad opent.';
    timerInterval=setInterval(renderTimer,500); renderTimer();
  }
});
$('#timer-reset').addEventListener('click',() => {
  deadline=null; clearInterval(timerInterval); remaining=1200; renderTimer();
  $('#timer-toggle').textContent='Start de timer';
  $('#timer-status').textContent='De timer blijft lopen als je de bron in een nieuw tabblad opent.';
});
window.addEventListener('storage',event => {
  if (event.key==='mijn-nederlands-v1') { state=loadState(storage,resources.map(resource=>resource.id)); renderResources(); renderWeek(); }
});
renderResources(); renderIdea(); renderWeek();
