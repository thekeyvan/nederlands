import {test} from 'node:test';
import assert from 'node:assert/strict';
import {articleWhy, orderWhy, spellingDiff, spellingWhy, verbWhy, irregularVerbWhy} from '../src/core/why.js';
import {verbItems, verbQuestion, articleItems, builderItem, dialogueSteps} from '../src/core/games.js';
import {vocabulary} from '../src/core/learning-data.js';
import {phrases, dialogues} from '../src/core/phrase-data.js';
import {buildOptions} from '../src/core/practice.js';
import {irregularCards} from '../src/core/irregular.js';

const plain = (why) => why?.fa.replace(/[⁦⁩*]/g, '');

test('werkwoorden: every option explains itself', () => {
  for (const item of verbItems(vocabulary)) {
    for (const kind of ['perfect', 'past']) {
      for (const option of verbQuestion(item, kind).options) {
        assert.ok(option.why?.fa, `${item.card.nl} ${kind} ${option.label}`);
        assert.ok(option.why.tag);
      }
    }
  }
});

test('werkwoorden: the reason matches the mistake', () => {
  const facts = {verb: 'gaan', past: 'ging', perfect: 'ben gegaan', note: 'onregelmatig'};
  assert.equal(verbWhy(facts, 'perfect', 'aux').tag, 'hebben of zijn');
  assert.match(plain(verbWhy(facts, 'perfect', 'aux')), /zijn/);
  const werken = {verb: 'werken', past: 'werkte', perfect: 'heb gewerkt', note: 'regelmatig'};
  assert.equal(verbWhy(werken, 'past', null).tag, '’t kofschip');
  assert.match(plain(verbWhy(werken, 'past', null)), /-te/);
  const leven = {verb: 'leven', past: 'leefde', perfect: 'heb geleefd', note: 'regelmatig'};
  assert.match(plain(verbWhy(leven, 'past', null)), /v/);
  assert.equal(verbWhy({verb: 'thuiswerken', past: 'werkte thuis', perfect: 'heb thuisgewerkt', note: 'regelmatig · scheidbaar'}, 'past', 'regular').tag, 'scheidbaar');
  // No note: a regular past (-te/-de) is never called irregular.
  assert.notEqual(verbWhy({verb: 'werken', past: 'werkte', perfect: 'heb gewerkt'}, 'past', null).tag, 'sterk werkwoord');
});

test('onregelmatig: plural and regular forms are named', () => {
  const facts = {verb: 'zijn', past: 'was', pastPlural: 'waren', perfect: 'is geweest', regular: {past: 'zijnde', participle: 'gezijnd', present: 'zijnt'}};
  assert.equal(irregularVerbWhy(facts, 1, 'waren', false).tag, 'enkelvoud');
  assert.equal(irregularVerbWhy(facts, 2, 'heeft geweest', false).tag, 'hebben of zijn');
  for (const card of irregularCards) for (const option of card.choices) assert.ok(option.why?.fa, `${card.id} ${option.label}`);
});

test('de of het: rules only when they match the word', () => {
  assert.equal(articleWhy('huisje', 'het').tag, '-je → altijd het');
  assert.equal(articleWhy('vergadering', 'de').tag, '-ing → de');
  assert.equal(articleWhy('eten', 'het', new Set(['eten'])).tag, 'werkwoord → het');
  assert.equal(articleWhy('ding', 'het').tag, 'uit je hoofd');
  for (const item of articleItems(vocabulary)) assert.ok(item.why.fa);
});

test('woorden: a wrong meaning says what it means instead', () => {
  const card = vocabulary.find((word) => word.meaning);
  const wrong = buildOptions(card, vocabulary, 'meaning').filter((option) => !option.correct);
  assert.ok(wrong.length);
  for (const option of wrong) assert.match(plain(option.why), new RegExp(card.nl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('zinnen bouwen: word order rules', () => {
  assert.equal(orderWhy('Morgen ga ik naar de huisarts.').tag, 'werkwoord op plek 2');
  assert.equal(orderWhy('Ik blijf thuis omdat ik ziek ben.').tag, 'werkwoord achteraan');
  assert.equal(orderWhy('Ik werk als monteur in een garage.').tag, 'werkwoord op plek 2');
  assert.equal(orderWhy('Kan ik morgen wat eerder weg?').tag, 'ja/nee-vraag');
  assert.equal(orderWhy('Van welk spoor vertrekt de trein?').tag, 'vraagwoord + werkwoord');
  const item = phrases.map((card) => builderItem(card, card.nl)).find(Boolean);
  assert.ok('why' in item);
});

test('gesprekken: a wrong line is translated', () => {
  const step = dialogueSteps(dialogues[0], dialogues).find((item) => item.options);
  for (const option of step.options) assert.equal(Boolean(option.why), !option.correct);
});

test('spelling: recognises the common mistakes', () => {
  assert.equal(spellingWhy('We maaken het', 'We maken het').tag, 'open lettergreep');
  assert.equal(spellingWhy('zwemen', 'zwemmen').tag, 'dubbele medeklinker');
  assert.equal(spellingWhy('de rijs', 'de reis').tag, 'ei of ij');
  assert.equal(spellingWhy('de hont', 'de hond').tag, 'd of t');
  assert.equal(spellingWhy('huis', 'het huis').tag, 'lidwoord');
  assert.equal(spellingWhy('het huis', 'het huis'), null);
  assert.deepEqual(spellingDiff('We maaken het', 'We maken het'), [{text: 'We ma', wrong: false}, {text: 'a', wrong: true}, {text: 'ken het', wrong: false}]);
});
