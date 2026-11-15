import test from 'node:test';
import assert from 'node:assert/strict';
import {checkContent} from '../scripts/content-check.mjs';

test('every lesson file is complete and consistent', () => {
  const {errors} = checkContent();
  assert.deepEqual(errors, []);
});
