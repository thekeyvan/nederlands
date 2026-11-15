import fa from './fa.js';
import {grammarFiles, themeFiles} from '../content/index.js';
import {lineId, phraseId, wordId} from '../content/ids.js';

// The Persian of every lesson lives next to the Dutch in the content files; collect it into the Persian pack.
fa.themes = {};
fa.cards = {};
fa.dialogues = {};
for (const theme of themeFiles) {
  fa.themes[theme.id] = theme.fa;
  for (const word of theme.words) fa.cards[wordId(theme, word)] = {meaning: word.fa, translation: word.exampleFa};
  theme.phrases.forEach((phrase, index) => { fa.cards[phraseId(theme, phrase, index)] = {meaning: phrase.fa}; });
  theme.dialogue.forEach((line, index) => { fa.dialogues[lineId(theme, line, index)] = line.fa; });
}
for (const rule of grammarFiles) fa.cards[rule.id] = {rule: rule.fa.rule, ...(rule.fa.note ? {note: rule.fa.note} : {}), translation: rule.fa.translation};

// Import and register complete translation packs here, e.g. {fa, es}.
export const locales = {fa};
