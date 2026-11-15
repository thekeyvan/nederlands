// The /stats proxy in front of Umami (server/stats.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import express from 'express';

const listen = (server) => new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));

test('forwards the tracker and events to Umami, and never breaks the site when Umami is down', async () => {
  const seen = [];
  const umami = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      seen.push({method: req.method, url: req.url, body, agent: req.headers['user-agent'], forwarded: req.headers['x-forwarded-for'], cookie: req.headers.cookie});
      res.setHeader('content-type', req.url === '/script.js' ? 'application/javascript' : 'application/json');
      res.end(req.url === '/script.js' ? '/*umami*/' : '{"cache":"token"}');
    });
  });
  process.env.UMAMI_URL = `http://127.0.0.1:${await listen(umami)}`;
  const {statsProxy} = await import('../server/stats.mjs');
  const app = express();
  app.set('trust proxy', true);
  app.use('/stats', statsProxy());
  const site = createServer(app);
  const base = `http://127.0.0.1:${await listen(site)}/stats`;

  const event = JSON.stringify({type: 'event', payload: {website: 'x', url: '/leren/oefenen'}});
  const sent = await fetch(`${base}/api/send`, {method: 'POST', body: event, headers: {'content-type': 'application/json', 'user-agent': 'Test/1', cookie: 'nedfa_session=secret', 'x-forwarded-for': '203.0.113.9'}});
  assert.equal(sent.status, 200);
  assert.deepEqual(await sent.json(), {cache: 'token'});
  const script = await fetch(`${base}/script.js`);
  assert.equal(await script.text(), '/*umami*/');

  assert.equal(seen[0].url, '/api/send');
  assert.equal(seen[0].body, event);
  assert.equal(seen[0].agent, 'Test/1');
  assert.equal(seen[0].forwarded, '203.0.113.9');
  assert.equal(seen[0].cookie, undefined, 'the session cookie never reaches Umami');
  assert.equal(seen[1].url, '/script.js');

  await new Promise((resolve) => umami.close(resolve));
  const down = await fetch(`${base}/api/send`, {method: 'POST', body: event, headers: {'content-type': 'application/json'}});
  assert.equal(down.status, 202);
  site.close();
});
