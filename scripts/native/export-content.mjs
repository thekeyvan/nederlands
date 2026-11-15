// Exports the lesson content for the native iOS app (ios-native/): one JSON file with every card, translation,
// dialogue, route stop and resource, plus game rounds and answer options computed with the same JavaScript as
// the website, so both apps ask the same questions. Run: node scripts/native/export-content.mjs
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {themes, vocabulary} from '../../src/core/learning-data.js';
import {phrases, dialogues} from '../../src/core/phrase-data.js';
import {sentences} from '../../src/core/sentence-data.js';
import {cards} from '../../src/core/learning-model.js';
import {courseLessons, levels, stamps} from '../../src/core/game.js';
import {buildOptions, cardKind} from '../../src/core/practice.js';
import {articleItems, builderItem, clozeItem, dialogueSteps, dictationItems, verbItems, verbQuestion} from '../../src/core/games.js';
import {resources} from '../../src/core/data.js';
import {audioCatalog} from '../../src/core/audio-catalog.js';
import {examplesFor} from '../../src/core/grammar-examples.js';
import {patternDrill, orderItem, pickOptions} from '../../src/lib/drill.ts';
import {groups} from '../site/content.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'ios-native/Nedfa/Resources/content.json');
const audio = (text) => Boolean(text && Object.hasOwn(audioCatalog.clips, text));
const options = (list) => list.map(({label, correct}) => ({label, correct}));
const poolFor = (card) => (cardKind(card) === 'phrase' ? phrases : vocabulary);

const cardJson = (card) => {
  const kind = cardKind(card);
  return {
    id: card.id, kind, themeId: card.themeId, themeTitle: card.themeTitle ?? null, wordKind: card.kind ?? null,
    nl: card.nl ?? null, example: card.example ?? null, forms: card.forms ?? null, meaning: card.meaning ?? null, translation: card.translation ?? null,
    level: card.level ?? null, title: card.title ?? null, pattern: card.pattern ?? null, prompt: card.prompt ?? null, answer: card.answer ?? null, rule: card.rule ?? null, note: card.note ?? null,
    hasAudio: audio(card.nl), exampleAudio: audio(card.example),
    meaningOptions: kind !== 'grammar' && card.meaning ? options(buildOptions(card, poolFor(card), 'meaning')) : null,
    dutchOptions: kind !== 'grammar' && card.nl ? options(buildOptions(card, poolFor(card), 'nl')) : null,
  };
};

const drillJson = (exercise) => ({
  ...cardJson(exercise), mode: exercise.mode,
  order: exercise.mode === 'order' ? (({first, tiles, answer, ending}) => ({first, tiles: tiles.map((tile) => tile.text), answer, ending}))(orderItem(exercise)) : null,
  pick: exercise.mode === 'pick' ? options(pickOptions(exercise)) : null,
});

const content = {
  generated: new Date().toISOString(),
  themes: themes.map((theme) => ({id: theme.id, title: theme.title, meaning: theme.meaning, intro: theme.intro, group: groups.find((group) => group.ids.includes(theme.id))?.id ?? 'dagelijks'})),
  groups: groups.map(({id, ids}) => ({id, title: {dagelijks: 'Elke dag', werk: 'Werk', vrijetijd: 'Vrije tijd & uitgaan', taal: 'Taal & contact'}[id], themeIds: ids})),
  cards: cards.map(cardJson),
  patterns: sentences.map((card) => ({
    id: card.id,
    examples: [{nl: card.example, gap: card.answer ?? '', translation: card.translation ?? '', hasAudio: audio(card.example)}, ...examplesFor(card.id).map((example) => ({nl: example.nl, gap: example.gap, translation: example.translation, hasAudio: audio(example.nl)}))],
    drill: patternDrill({...card, themeId: 'zinsbouw'}).map(drillJson),
  })),
  dialogues: dialogues.map((dialogue) => ({id: dialogue.id, themeId: dialogue.themeId, lines: dialogue.lines.map((line) => ({id: line.id, speaker: line.speaker, nl: line.nl, translation: line.translation, hasAudio: audio(line.nl)}))})),
  lessons: courseLessons.map(({id, title, level, grammarIds, themeIds, cardIds, goal, task}) => ({id, title, level, grammarIds, themeIds, cardIds, goal, task})),
  levels,
  stamps: stamps.map(({id, title, description}) => ({id, title, description})),
  resources: resources.map(({id, name, categories, level, cost, description, url, steps, time, note}) => ({id, name, categories, level, cost, description, url, steps, time: time ?? null, note: note ?? null})),
  audio: {voices: audioCatalog.voices.map(({id, name}) => ({id, name})), clips: audioCatalog.clips},
  games: {
    articles: articleItems(vocabulary).map((item) => ({cardId: item.card.id, article: item.article, noun: item.noun})),
    verbs: verbItems(vocabulary).flatMap((item) => ['perfect', 'past'].map((kind) => {
      const question = verbQuestion(item, kind);
      return {cardId: item.card.id, kind, answer: question.answer, options: question.options};
    })),
    cloze: [...phrases, ...sentences.map((card) => ({...card, themeId: 'zinsbouw'}))].map((card) => {
      const item = clozeItem(card, cardKind(card) === 'grammar' ? sentences : phrases);
      return item ? {cardId: card.id, before: item.before, after: item.after, answer: item.answer, options: item.options} : null;
    }).filter(Boolean),
    dictation: dictationItems([...phrases, ...vocabulary]).filter((card) => audio(card.nl)).map((card) => card.id),
    builder: phrases.map((card) => {
      const item = builderItem(card, card.nl);
      return item ? {cardId: card.id, first: item.first, answer: item.answer, tiles: item.tiles.map((tile) => tile.text), ending: item.ending, sentence: item.sentence} : null;
    }).filter(Boolean),
    conversations: dialogues.map((dialogue) => ({dialogueId: dialogue.id, steps: dialogueSteps(dialogue, dialogues).map((step) => ({lineId: step.line.id, options: step.options?.map((option) => ({lineId: option.line.id, correct: option.correct})) ?? null}))})),
  },
};

await mkdir(path.dirname(OUT), {recursive: true});
await writeFile(OUT, JSON.stringify(content));
// Public Supabase settings (the same values every website visitor receives), for sign-in and sync.
let url = process.env.PUBLIC_SUPABASE_URL || '';
let key = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
if (!url || !key) ({url, key} = await (await fetch('https://nedfa.nl/deployment-config.json')).json());
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key?.startsWith('sb_publishable_')) throw new Error('Missing public Supabase settings.');
await writeFile(path.join(path.dirname(OUT), 'config.json'), JSON.stringify({supabaseUrl: url, supabaseKey: key}));
console.log(`Native content: ${content.cards.length} cards, ${content.themes.length} themes, ${content.patterns.length} patterns → ${path.relative(ROOT, OUT)}`);
