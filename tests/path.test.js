// The path in Leren: situations in order, five steps each (src/core/path.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {conversationId, currentTheme, nextStep, pathSections, pathThemes, stepRound, themeSteps, themesForIrregular, themesForRule} from '../src/core/path.js';
import {themes, vocabulary} from '../src/core/learning-data.js';
import {phrases} from '../src/core/phrase-data.js';
import {buildNativeContent} from '../src/core/native-content.js';

const day = 86400000;
const review = (repetitions = 1, grade = 4) => ({ease: 2.5, interval: 6, repetitions, due: new Date(Date.now() + 5 * day).toISOString(), lastReviewed: new Date(Date.now() - day).toISOString(), grade, reviews: repetitions});
const practise = (cards, repetitions = 1) => Object.fromEntries(cards.map((card) => [card.id, review(repetitions)]));

test('every situation is on the path once, from A0 to B1, and has grammar', () => {
  assert.equal(pathThemes.length, themes.length);
  assert.equal(new Set(pathThemes.map((theme) => theme.id)).size, themes.length);
  assert.equal(pathSections[0].themes[0].id, 'kennismaken');
  assert.ok(pathThemes.every((theme) => theme.grammar.length >= 1));
  assert.deepEqual(themesForRule('zin:advies').map((theme) => theme.id), ['huisarts', 'huis-kopen']);
  assert.deepEqual(themesForIrregular('ij-ee').map((theme) => theme.id), ['verkeer']);
});

test('five steps, in order, each finished from the review history', () => {
  const steps = themeSteps('huisarts', {});
  assert.deepEqual(steps.map((step) => step.id), ['woorden', 'zinnen', 'grammatica', 'gesprek', 'eindspel']);
  assert.equal(nextStep(steps).id, 'woorden');
  const words = vocabulary.filter((card) => card.themeId === 'huisarts');
  const sentences = phrases.filter((card) => card.themeId === 'huisarts');
  let reviews = practise(words);
  assert.equal(nextStep(themeSteps('huisarts', reviews)).id, 'zinnen');
  reviews = {...reviews, ...practise(sentences)};
  assert.equal(nextStep(themeSteps('huisarts', reviews)).id, 'grammatica');
  reviews = {...reviews, 'zin:kunnen': review(), 'zin:zou-kunnen': review(), 'zin:advies': review()};
  assert.equal(nextStep(themeSteps('huisarts', reviews)).id, 'gesprek');
  reviews = {...reviews, [conversationId('huisarts')]: review()};
  assert.equal(nextStep(themeSteps('huisarts', reviews)).id, 'eindspel');
  reviews = {...reviews, ...practise([...words, ...sentences], 3)};
  assert.equal(nextStep(themeSteps('huisarts', reviews)), null);
});

test('an Onregelmatig set is part of the grammar step', () => {
  const step = themeSteps('verkeer', {}).find((item) => item.id === 'grammatica');
  assert.equal(step.irregular.id, 'ij-ee');
  assert.equal(step.total, 3);
  const after = {'zin:hebben-zijn': review(), 'zin:als': review()};
  assert.equal(stepRound('verkeer', 'grammatica', after).kind, 'irregular');
});

test('each step starts the right round', () => {
  const words = stepRound('huisarts', 'woorden', {});
  assert.ok(words.queue.length > 0 && words.queue.every((card) => card.themeId === 'huisarts' && !card.id.startsWith('phrase:')));
  assert.ok(stepRound('huisarts', 'zinnen', {}).queue.every((card) => card.id.startsWith('phrase:huisarts')));
  const grammar = stepRound('huisarts', 'grammatica', {});
  assert.equal(grammar.drill, true);
  assert.equal(grammar.queue[0].id, 'zin:kunnen');
  assert.deepEqual(stepRound('huisarts', 'gesprek', {}), {kind: 'game', game: 'gesprek'});
  assert.equal(stepRound('huisarts', 'eindspel', {}).queue.length, 12);
});

test('you are on the situation you practised last, else the first unfinished one for your level', () => {
  assert.equal(currentTheme({}, [], null), 'kennismaken');
  assert.equal(currentTheme({}, [], 'A2'), pathThemes.find((theme) => theme.level !== 'A0').id);
  assert.equal(currentTheme({}, [], 'B1'), pathThemes.find((theme) => theme.level === 'B1').id);
  const card = vocabulary.find((item) => item.themeId === 'apotheek');
  assert.equal(currentTheme({[card.id]: review()}, [{id: 'e', cardId: card.id, grade: 4, at: new Date().toISOString()}], null), 'apotheek');
});

test('the iPhone app gets the path and each theme’s grammar', () => {
  const content = buildNativeContent();
  assert.equal(content.path.flatMap((section) => section.themeIds).length, themes.length);
  assert.deepEqual(content.themes.find((theme) => theme.id === 'huisarts').grammar, ['zin:kunnen', 'zin:zou-kunnen', 'zin:advies']);
});
