// Onregelmatig: irregular forms as review cards (src/core/irregular.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {checkForm, formInput, irregularCards, irregularProgress, irregularRound, irregularSet, irregularSets, regularForms} from '../src/core/irregular.js';
import {normalizeAnswer} from '../src/core/practice.js';
import {buildNativeContent} from '../src/core/native-content.js';

const card = (id) => irregularCards.find((item) => item.id === id);
const review = (days, repetitions = 1, grade = 4) => {
  const due = new Date(Date.now() + days * 86400000).toISOString();
  return {ease: 2.5, interval: 1, repetitions, due, lastReviewed: new Date(Date.now() - 86400000).toISOString(), grade, reviews: repetitions};
};

test('the regular form a learner wrongly makes follows ’t kofschip and the spelling rules', () => {
  assert.deepEqual(regularForms('blijven'), {stem: 'blijf', past: 'blijfde', participle: 'geblijfd', present: 'blijft'});
  assert.equal(regularForms('lopen').past, 'loopte');
  assert.equal(regularForms('zwemmen').participle, 'gezwemd');
  assert.equal(regularForms('lezen').past, 'leesde');
  assert.equal(regularForms('begrijpen').participle, 'begrijpt');
  assert.equal(regularForms('eten').participle, 'geëet');
});

test('ids are stable, unique and made from the Dutch', () => {
  assert.equal(new Set(irregularCards.map((item) => item.id)).size, irregularCards.length);
  for (const id of ['onr:blijven:verleden', 'onr:blijven:deelwoord', 'onr:de-stad:meervoud', 'onr:goed:meer', 'onr:goed:meest', 'onr:nu:jij-te-laat']) assert.ok(card(id), id);
  assert.ok(irregularCards.every((item) => item.id.startsWith('onr:')));
});

test('every form has four different choices, exactly one right, none that is also accepted', () => {
  for (const item of irregularCards) {
    assert.equal(item.choices.length, 4, item.id);
    assert.equal(item.choices.filter((choice) => choice.correct).length, 1, item.id);
    assert.equal(new Set(item.choices.map((choice) => normalizeAnswer(choice.label))).size, 4, item.id);
    const accepted = new Set(item.accept.map(normalizeAnswer));
    assert.ok(item.choices.every((choice) => choice.correct || !accepted.has(normalizeAnswer(choice.label))), item.id);
  }
});

test('verbs that take hebben and zijn accept both, and never offer the other one as a mistake', () => {
  const ride = card('onr:rijden:deelwoord');
  assert.deepEqual(ride.accept, ['heeft gereden', 'is gereden']);
  assert.ok(!ride.choices.some((choice) => choice.label === 'is gereden'));
  assert.ok(card('onr:blijven:deelwoord').choices.some((choice) => choice.label === 'heeft gebleven'));
});

test('typed answers: exact, an accepted variant, or close without hebben/zijn', () => {
  assert.equal(checkForm('bleef', card('onr:blijven:verleden')).result, 'correct');
  assert.equal(checkForm('  Is Gebleven ', card('onr:blijven:deelwoord')).result, 'correct');
  assert.deepEqual(checkForm('gebleven', card('onr:blijven:deelwoord')), {result: 'close', hint: 'aux'});
  assert.equal(checkForm('heeft gebleven', card('onr:blijven:deelwoord')).result, 'wrong');
  assert.equal(checkForm('wou', card('onr:willen:verleden')).result, 'correct');
  assert.equal(checkForm("de foto's", card('onr:de-foto:meervoud')).result, 'correct');
  assert.equal(checkForm('', card('onr:goed:meer')).result, 'wrong');
});

test('new forms are chosen, known ones typed', () => {
  assert.equal(formInput(undefined), 'choose');
  assert.equal(formInput(review(1, 1)), 'choose');
  assert.equal(formInput(review(1, 2)), 'type');
});

test('a round: due forms first, then new ones in order (past before participle), then the oldest', () => {
  const set = irregularSet('ij-ee');
  const reviews = {'onr:kijken:verleden': review(-1), 'onr:blijven:verleden': review(3)};
  const queue = irregularRound('ij-ee', reviews).map((item) => item.id);
  assert.equal(queue.length, 10);
  assert.equal(queue[0], 'onr:kijken:verleden');
  assert.deepEqual(queue.slice(1, 4), ['onr:blijven:deelwoord', 'onr:schrijven:verleden', 'onr:schrijven:deelwoord']);
  assert.ok(!queue.includes('onr:blijven:verleden'));
  assert.equal(irregularRound('ij-ee', Object.fromEntries(set.cards.map((item) => [item.id, review(5)]))).length, 10);
  // All sets together only repeats what you practised; with nothing practised it starts at the first set.
  assert.deepEqual(irregularRound('all', reviews).map((item) => item.id), ['onr:kijken:verleden', 'onr:blijven:verleden']);
  assert.equal(irregularRound('all', {})[0].id, irregularSets[0].cards[0].id);
});

test('set progress gives stars like a theme', () => {
  const set = irregularSet('vergelijken');
  assert.deepEqual(irregularProgress(set, {}), {total: 26, done: 0, known: 0, due: 0, stars: 0});
  const all = Object.fromEntries(set.cards.map((item) => [item.id, review(5, 1)]));
  assert.equal(irregularProgress(set, all).stars, 2);
  const known = Object.fromEntries(set.cards.map((item) => [item.id, review(30, 3)]));
  assert.equal(irregularProgress(set, known).stars, 3);
});

test('the iPhone app gets the sets and the form cards', () => {
  const {irregular} = buildNativeContent();
  assert.equal(irregular.sets.length, irregularSets.length);
  assert.equal(irregular.cards.length, irregularCards.length);
  const first = irregular.cards.find((item) => item.id === 'onr:blijven:deelwoord');
  assert.equal(first.mode, 'form');
  assert.equal(first.ask, 2);
  assert.deepEqual(first.chain, ['blijven', 'bleef', 'is gebleven']);
  assert.ok(irregular.sets.every((set) => set.cardIds.every((id) => irregular.cards.some((item) => item.id === id))));
});
