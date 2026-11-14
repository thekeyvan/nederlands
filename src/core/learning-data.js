import {baseThemes} from '../../content/themes.js';
import {baseVocabulary} from '../../content/words.js';
import {locale,translateCard} from './i18n.js';
export const themes=baseThemes.map(theme=>({...theme,meaning:locale.themes[theme.id] || ''}));
export const vocabulary=baseVocabulary.map(word=>({...translateCard(word),themeTitle:themes.find(theme=>theme.id===word.themeId).title}));
export function searchVocabulary(query,themeId='all',kind='all') {
 const normalized=query.trim().toLocaleLowerCase('nl');
 return vocabulary.filter(word=>(themeId==='all'||word.themeId===themeId)&&(kind==='all'||word.kind===kind)&&`${word.nl} ${word.meaning || ''} ${word.example || ''} ${word.translation || ''}`.toLocaleLowerCase('nl').includes(normalized));
}
