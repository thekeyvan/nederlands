import {basePhrases} from './content/phrases.js';
import {baseDialogues} from './content/dialogues.js';
import {baseThemes} from './content/themes.js';
import {locale,translateCard} from './i18n.js';
export const phrases=basePhrases.map(card=>({...translateCard(card),themeTitle:baseThemes.find(theme=>theme.id===card.themeId).title}));
export const dialogues=baseDialogues.map(dialogue=>({...dialogue,lines:dialogue.lines.map(line=>({...line,translation:locale.dialogues[line.id] || ''}))}));
