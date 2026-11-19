// Accounts on Postgres: linking Apple and Google to one learner, merging, sessions and the progress API.
// Runs only with a throwaway database: TEST_DATABASE_URL=postgres://… npm test
import test from 'node:test';
import assert from 'node:assert/strict';

const url = process.env.TEST_DATABASE_URL;
const options = {skip: url ? false : 'set TEST_DATABASE_URL to run the account tests'};

test('accounts: one learner for Apple and Google, merging and the progress API', options, async (t) => {
  process.env.DATABASE_URL = url;
  const {pool, migrate} = await import('../server/db.mjs');
  const auth = await import('../server/auth.mjs');
  const {accountApi} = await import('../server/api.mjs');
  const express = (await import('express')).default;
  await pool.query('drop schema public cascade; create schema public;');
  await migrate();

  const google = (subject, email) => ({provider: 'google', subject, email, emailVerified: true, name: 'Sara'});
  const apple = (subject, email, emailVerified = true) => ({provider: 'apple', subject, email, emailVerified, name: null});

  await t.test('the same sign-in finds the same learner', async () => {
    const first = await auth.signInIdentity(google('g1', 'sara@example.com'));
    assert.equal(await auth.signInIdentity(google('g1', 'sara@example.com')), first);
  });

  await t.test('Apple with the same verified email joins the Google account', async () => {
    const viaGoogle = await auth.signInIdentity(google('g2', 'Ali@Example.com'));
    const viaApple = await auth.signInIdentity(apple('a2', 'ali@example.com'));
    assert.equal(viaApple, viaGoogle);
    assert.deepEqual((await auth.profile(viaGoogle)).providers, ['google', 'apple']);
  });

  await t.test('a hidden Apple email makes its own learner, and linking merges progress', async () => {
    const main = await auth.signInIdentity(google('g3', 'noor@example.com'));
    const hidden = await auth.signInIdentity(apple('a3', 'x1@privaterelay.appleid.com', false));
    assert.notEqual(hidden, main);
    const card = (user, id, last, ease) => pool.query(
      `insert into review_cards values($1,$2,$3,1,1,now(),$4,4,1)`, [user, id, ease, last]);
    await card(main, 'werk:de-baan', '2026-01-01T10:00:00Z', 2.5);
    await card(hidden, 'werk:de-baan', '2026-02-01T10:00:00Z', 2.7);
    await card(hidden, 'huis:de-sleutel', '2026-02-01T10:00:00Z', 2.5);
    // Adding Apple from Ik while signed in with Google:
    assert.equal(await auth.signInIdentity(apple('a3', 'x1@privaterelay.appleid.com', false), main), main);
    const {rows} = await pool.query('select card_id, ease::float8 as ease from review_cards where user_id=$1 order by card_id', [main]);
    assert.deepEqual(rows, [{card_id: 'huis:de-sleutel', ease: 2.5}, {card_id: 'werk:de-baan', ease: 2.7}]);
    assert.equal((await pool.query('select 1 from users where id=$1', [hidden])).rowCount, 0);
    assert.equal(await auth.signInIdentity(apple('a3', null, false)), main);
  });

  await t.test('sessions and one-time codes', async () => {
    const user = await auth.signInIdentity(google('g4', 'lea@example.com'));
    const token = await auth.createSession(user);
    assert.equal(await auth.sessionUser(token), user);
    assert.equal(await auth.sessionUser('wrong'), null);
    const code = await auth.createCode('login', user);
    assert.equal(await auth.useCode('link', code), null);
    assert.equal(await auth.useCode('login', code), user);
    assert.equal(await auth.useCode('login', code), null);
  });

  await t.test('the HTTP API for the app and the website', async () => {
    const app = express();
    app.use('/api', accountApi());
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}/api`;
    try {
      const user = await auth.signInIdentity(google('g5', 'mo@example.com'));
      await auth.signInIdentity(apple('a5', 'mo@example.com'));
      const token = await auth.createSession(user);
      const call = (path, init = {}) => fetch(base + path, {...init, headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers}});

      assert.deepEqual(await (await fetch(`${base}/me`)).json(), {user: null});
      const me = await (await call('/me')).json();
      assert.deepEqual(me.user.providers, ['google', 'apple']);

      const cards = [{id: 'werk:de-baan', ease: 2.5, interval: 1, repetitions: 1, due: '2026-03-02T10:00:00Z', lastReviewed: '2026-03-01T10:00:00Z', grade: 4, reviews: 1}];
      const events = [{id: '6f1c2c38-3d38-4bdb-9f7a-1c39a6a1b001', cardId: 'werk:de-baan', grade: 4, at: '2026-03-01T10:00:00Z'}];
      assert.equal((await call('/me/sync', {method: 'POST', body: JSON.stringify({cards, events})})).status, 200);
      assert.equal((await call('/me/sync', {method: 'POST', body: JSON.stringify({cards: [{...cards[0], grade: 2}]})})).status, 400);
      assert.equal((await call('/me/preferences', {method: 'PUT', body: JSON.stringify({data: {goal: 10}, updated_at: '2026-03-01T10:00:00Z'})})).status, 200);
      const progress = await (await call('/me/progress')).json();
      assert.equal(progress.cards[0].card_id, 'werk:de-baan');
      assert.equal(progress.cards[0].ease, 2.5);
      assert.equal(progress.events.length, 1);
      assert.equal(progress.preferences.data.goal, 10);

      // A cookie request from another site may not change anything.
      const foreign = await fetch(`${base}/me/sync`, {method: 'POST', headers: {'Content-Type': 'application/json', Cookie: `nedfa_session=${token}`, Origin: 'https://evil.example'}, body: '{}'});
      assert.equal(foreign.status, 403);

      assert.equal((await call('/me/identities/apple', {method: 'DELETE'})).status, 200);
      assert.equal((await call('/me/identities/google', {method: 'DELETE'})).status, 409);
      const google5 = await auth.signInIdentity(google('g5', 'mo@example.com'));
      assert.equal(google5, user);

      assert.equal((await call('/me', {method: 'DELETE'})).status, 200);
      assert.equal((await call('/me')).status, 200);
      assert.deepEqual(await (await call('/me')).json(), {user: null});
    } finally {
      server.close();
    }
  });

  await t.test('feedback: anyone can send, only admins can read', async () => {
    const reader = await auth.signInIdentity(google('g6', 'team@example.com'));
    const learner = await auth.signInIdentity(google('g7', 'leerling@example.com'));
    process.env.ADMINS = reader;
    const app = express();
    app.set('trust proxy', true);
    app.use('/api', accountApi());
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}/api`;
    try {
      const post = (body, token) => fetch(`${base}/feedback`, {method: 'POST', headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})}, body: JSON.stringify(body)});
      const pixel = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString('base64');
      assert.equal((await post({kind: 'probleem', message: 'De knop doet niets', screen: 'Thema: Werk', context: {card: 'werk:de-baan'}, platform: 'ios', appVersion: '1.0 (12)', screenshot: pixel}, await auth.createSession(learner))).status, 201);
      assert.equal((await post({kind: 'idee', message: 'Meer spellen!'})).status, 201);
      assert.equal((await post({kind: 'idee', message: '   '})).status, 400);
      assert.equal((await post({kind: 'idee', message: 'x', screenshot: Buffer.from('not an image').toString('base64')})).status, 400);

      assert.equal((await fetch(`${base}/feedback`, {headers: {Authorization: `Bearer ${await auth.createSession(learner)}`}})).status, 404);
      const token = await auth.createSession(reader);
      const list = await (await fetch(`${base}/feedback`, {headers: {Authorization: `Bearer ${token}`}})).json();
      assert.equal(list.feedback.length, 2);
      const report = list.feedback.find((item) => item.kind === 'probleem');
      assert.equal(report.email, 'leerling@example.com');
      assert.equal(report.context.card, 'werk:de-baan');
      assert.equal(report.has_screenshot, true);
      const image = await fetch(`${base}/feedback/${report.id}/screenshot`, {headers: {Authorization: `Bearer ${token}`}});
      assert.equal(image.headers.get('content-type'), 'image/jpeg');
      assert.equal((await fetch(`${base}/feedback/${report.id}`, {method: 'PATCH', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`}, body: JSON.stringify({status: 'gepland'})})).status, 200);
      // The dashboard overview: only for admins, counts only.
      assert.equal((await fetch(`${base}/admin/overview`, {headers: {Authorization: `Bearer ${await auth.createSession(learner)}`}})).status, 404);
      await pool.query(`insert into review_events(user_id,id,card_id,grade,reviewed_at) values ($1,gen_random_uuid(),'werk:de-baan',1,now() - interval '8 days'),($1,gen_random_uuid(),'werk:de-baan',4,now())`, [learner]);
      const overview = await (await fetch(`${base}/admin/overview`, {headers: {Authorization: `Bearer ${token}`}})).json();
      assert.equal(overview.feedback.gepland, 1);
      assert.deepEqual(overview.retention.find((row) => row.days === 7), {days: 7, eligible: 1, returned: 1});
      assert.deepEqual(overview.cards, [{id: 'werk:de-baan', answers: 2, wrong: 1, learners: 1}]);
      assert.equal(overview.active.week, 1);
      // Deleting the account also removes what that learner sent.
      await pool.query('delete from users where id=$1', [learner]);
      assert.equal((await pool.query('select count(*)::int as n from feedback')).rows[0].n, 1);
    } finally {
      server.close();
    }
  });

  await pool.end();
});
