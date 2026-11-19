import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newsFor, newsMark, newsShows, newsState} from '../src/core/news.js';

test('news show follows the level', () => {
  for (const level of [null, 'A0', 'A1', 'A2']) assert.equal(newsFor(level).id, 'makkelijk');
  assert.equal(newsFor('B1').id, 'jeugd');
});

// Makkelijke Taal's handle (@NOSJournaalinMakkelijkeTaal) gives a 404; its channel is still at the old /c/NOSNieuwsvandeWeek address.
test('every news show opens a YouTube channel', () => {
  for (const show of newsShows) assert.match(show.url, /^https:\/\/www\.youtube\.com\/(@|c\/)[\w]+\/videos$/);
  assert.equal(newsShows.find((show) => show.id === 'makkelijk').url, 'https://www.youtube.com/c/NOSNieuwsvandeWeek/videos');
});

test('news state is only kept for today', () => {
  const today = new Date(2026, 10, 19, 18);
  const yesterday = new Date(2026, 10, 18, 18);
  assert.equal(newsState(null, today), 'idle');
  assert.equal(newsState(newsMark('asked', today), today), 'asked');
  assert.equal(newsState(newsMark('done', today), today), 'done');
  assert.equal(newsState(newsMark('done', yesterday), today), 'idle');
  assert.equal(newsState({day: newsMark('done', today).day, state: 'weird'}, today), 'idle');
});
