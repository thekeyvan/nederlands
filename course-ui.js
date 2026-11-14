import {courseLessons} from './content/course.js';
import {sentences} from './sentence-data.js';
import {themes} from './learning-data.js';
import {getProgress} from './progress-store.js';
import {$,el,button} from './ui.js';

export function createCourse({onPractice,onGrammar,onTheme}){
 const rows=courseLessons.map((lesson,index)=>{
  const row=el('details','course-lesson'),summary=el('summary'),status=el('span','course-status');
  summary.append(el('span','pill',`${index+1} · ${lesson.level}`),el('strong','',lesson.title),status);
  const links=el('div','course-links');
  for(const id of lesson.grammarIds){const card=sentences.find(card=>card.id===id);links.append(button(card.title,()=>onGrammar(id),'course-link'));}
  const topics=el('div','course-links');
  for(const id of lesson.themeIds)topics.append(button(themes.find(theme=>theme.id===id).title,()=>onTheme(id),'text-action','arrow-right'));
  const progress=el('progress');progress.max=lesson.cardIds.length;progress.setAttribute('aria-label',`${lesson.title}: geoefende kaartjes`);
  row.append(summary,el('p','course-goal',lesson.goal),links,el('h3','','Zeg het zelf'),el('p','course-task',lesson.task),topics,progress,button('Oefen deze stap',()=>onPractice(lesson),'button secondary','arrow-right'));
  return {row,status,progress,lesson};
 });
 $('#course-lessons').replaceChildren(...rows.map(item=>item.row));
 function update(){
  const {reviews}=getProgress();
  for(const {lesson,status,progress} of rows){const done=lesson.cardIds.filter(id=>reviews[id]).length;status.textContent=`${done} / ${lesson.cardIds.length} geoefend`;progress.value=done;}
 }
 update();const next=rows.find(({progress})=>progress.value<progress.max);if(next)next.row.open=true;return {update};
}
