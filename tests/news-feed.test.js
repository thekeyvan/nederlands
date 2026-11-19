import {test} from 'node:test';
import assert from 'node:assert/strict';
import {channels, latest, latestFromFeed, showLink, videoUrl} from '../server/news.mjs';

const entry = (id, link, title) => `<entry><id>yt:video:${id}</id><yt:videoId>${id}</yt:videoId><title>${title}</title><link rel="alternate" href="${link}"/><published>2026-11-19T16:53:37+00:00</published></entry>`;
const feed = `<feed><title>Jeugdjournaal</title>${entry('GLLilyMqjlU', 'https://www.youtube.com/shorts/GLLilyMqjlU', 'GTA #games')}${entry('F38ZnfWgGZ0', 'https://www.youtube.com/watch?v=F38ZnfWgGZ0', 'Trump &amp; Xi')}</feed>`;

test('the newest regular video is chosen, Shorts are skipped', () => {
  assert.deepEqual(latestFromFeed(feed), {videoId: 'F38ZnfWgGZ0', title: 'Trump & Xi', published: '2026-11-19T16:53:37+00:00'});
  assert.equal(latestFromFeed('<feed></feed>'), null);
});

test('the video opens with the channel uploads as playlist', () => {
  assert.equal(videoUrl('makkelijk', {videoId: 'abc123DEF45'}), 'https://www.youtube.com/watch?v=abc123DEF45&list=UUch2JvY2ZSwcjf5gb93HGQw');
});

test('without YouTube the channel page is used; a cached video is kept', async () => {
  const failing = async () => { throw new Error('offline'); };
  assert.equal((await showLink('makkelijk', failing)).url, channels.makkelijk.page);
  assert.equal((await showLink('nos', failing)).url, 'https://npo.nl/start/serie/nos-journaal-20-00-uur/afleveringen');
  const ok = async () => ({ok: true, text: async () => feed});
  assert.equal((await latest('jeugd', ok, 0)).videoId, 'F38ZnfWgGZ0');
  assert.equal((await latest('jeugd', failing, 20 * 60_000)).videoId, 'F38ZnfWgGZ0');
});
