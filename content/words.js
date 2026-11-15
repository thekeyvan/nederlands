// Every word of every theme, read from content/themes/*.json. The Persian is added by locales/index.js.
import {themeFiles} from './index.js';
import {wordId} from './ids.js';

export const baseVocabulary = themeFiles.flatMap((theme) =>
  theme.words.map((word) => ({nl: word.nl, kind: word.kind, example: word.example, id: wordId(theme, word), themeId: theme.id, ...(word.forms ? {forms: word.forms} : {})})),
);
