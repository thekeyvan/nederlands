// Lesson content for the public pages, joined with the Persian translations. Same sources as the app.
import {baseThemes} from '../../content/themes.js';
import {baseVocabulary} from '../../content/words.js';
import {basePhrases} from '../../content/phrases.js';
import {baseDialogues} from '../../content/dialogues.js';
import {baseSentences} from '../../content/grammar.js';
import {grammarExamples} from '../../content/grammar-examples.js';
import {locales} from '../../locales/index.js';

const fa = locales.fa;

/** Theme groups, in the order the pages list them, with their Persian names. */
export const groups = [
  {id: 'dagelijks', fa: 'زندگی روزمره', ids: ['boodschappen', 'wonen', 'huis-kopen', 'huishouden', 'school', 'digitaal', 'geld', 'gemeente', 'huisarts', 'apotheek', 'gezondheid', 'noodgeval']},
  {id: 'werk', fa: 'کار و شغل', ids: ['werk', 'overleg', 'loopbaan', 'beroepen', 'solliciteren']},
  {id: 'vrijetijd', fa: 'اوقات فراغت و بیرون', ids: ['vrijetijd', 'cultuur', 'reizen', 'verkeer', 'natuur', 'uitgaan', 'kleding', 'feest']},
  {id: 'taal', fa: 'زبان، ارتباط و احساسات', ids: ['contact', 'mening', 'familie', 'weer', 'tijd', 'modalen', 'inburgering']},
];

export const kindFa = {woord: 'واژه', werkwoord: 'فعل', uitdrukking: 'اصطلاح'};

export const themes = baseThemes.map((theme) => {
  const words = baseVocabulary.filter((word) => word.themeId === theme.id).map((word) => ({...word, ...(fa.cards[word.id] ?? {})}));
  const phrases = basePhrases.filter((phrase) => phrase.themeId === theme.id).map((phrase) => ({...phrase, ...(fa.cards[phrase.id] ?? {})}));
  const dialogue = baseDialogues.find((item) => item.themeId === theme.id);
  return {
    ...theme,
    fa: fa.themes[theme.id] ?? theme.title,
    group: groups.find((group) => group.ids.includes(theme.id))?.id ?? 'dagelijks',
    words,
    phrases,
    dialogue: dialogue ? dialogue.lines.map((line) => ({...line, translation: fa.dialogues[line.id] ?? ''})) : [],
  };
});

/** Grammar patterns with their Persian rule, note and all example sentences. */
export const patterns = baseSentences.map((card) => {
  const t = fa.cards[card.id] ?? {};
  const extra = (grammarExamples[card.id] ?? []).map(([nl, gap, translation]) => ({nl, gap, translation}));
  return {
    ...card,
    slug: card.id.replace(/^zin:/, ''),
    rule: t.rule ?? '',
    note: t.note ?? '',
    examples: [{nl: card.example, gap: card.answer, translation: t.translation ?? ''}, ...extra],
  };
});

export const totals = {
  themes: themes.length,
  words: baseVocabulary.length,
  phrases: basePhrases.length,
  dialogues: baseDialogues.length,
  patterns: patterns.length,
  examples: patterns.reduce((sum, pattern) => sum + pattern.examples.length, 0),
};
