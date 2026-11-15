// The niveautest and what the level changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS, placementDone, placementQuestions, placementResult, sortForLevel, startTheme, suggestedThemes} from '../src/core/level.js';
import {themes} from '../src/core/learning-data.js';

test('every level has a block of five questions with four different options', () => {
  for (const level of LEVELS) assert.equal(placementQuestions.filter((question) => question.level === level).length, 5, level);
  for (const question of placementQuestions) {
    assert.equal(new Set(question.options).size, 4, question.prompt);
    assert.ok(question.options.includes(question.answer), question.prompt);
    if (question.kind === 'fill') assert.equal(question.prompt.split('___').length, 2, question.prompt);
  }
});

test('the start level is the first block that is not passed', () => {
  assert.equal(placementResult({}), 'A0');
  assert.equal(placementResult({A0: 3}), 'A0');
  assert.equal(placementResult({A0: 5, A1: 2}), 'A1');
  assert.equal(placementResult({A0: 5, A1: 4, A2: 3}), 'A2');
  assert.equal(placementResult({A0: 5, A1: 5, A2: 4, B1: 1}), 'B1');
  assert.equal(placementResult({A0: 5, A1: 5, A2: 5, B1: 5}), 'B1');
});

test('a block stops early once it can no longer be passed', () => {
  assert.equal(placementDone('A1', 0, 2), true);
  assert.equal(placementDone('A1', 1, 2), false);
  assert.equal(placementDone('A1', 4, 4), false);
  assert.equal(placementDone('A1', 4, 5), true);
});

test('beginners get the A0 themes first; without a level the course order stays', () => {
  assert.equal(themes.find((theme) => theme.id === startTheme(themes, 'A0')).level, 'A0');
  assert.equal(sortForLevel(themes, null), themes);
  assert.equal(sortForLevel(themes, 'B1')[0].level, 'B1');
  const done = new Set(['kennismaken']);
  const picks = suggestedThemes(themes, 'A0', (id) => (done.has(id) ? {done: 10, total: 10} : {done: 0, total: 10}), 3);
  assert.equal(picks.length, 3);
  assert.ok(picks.every((theme) => theme.level === 'A0' && theme.id !== 'kennismaken'));
});
