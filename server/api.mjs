// Accounts and progress API for the website (session cookie) and the iPhone app (bearer token).
import express from 'express';
import {pool} from './db.mjs';
import {APP_CALLBACK, GOOGLE_CLIENT_ID, cleanUp, createCode, createSession, endSession, profile, randomToken, sessionUser, signInIdentity, useCode, verifyApple, verifyGoogle} from './auth.mjs';

const COOKIE = 'nedfa_session';
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'https://nedfa.nl';
const cookieOptions = (req) => ({httpOnly: true, secure: req.secure, sameSite: 'lax', path: '/', maxAge: 180 * 24 * 3600 * 1000});

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/** The session token from the app's Authorization header or the website's cookie. */
function sessionToken(req) {
  const header = req.get('authorization') || '';
  if (header.startsWith('Bearer ')) return {token: header.slice(7).trim(), cookie: false};
  return {token: readCookie(req, COOKIE), cookie: true};
}

/** Cookie requests that change something must come from our own pages (blocks cross-site requests). */
function sameOrigin(req) {
  const origin = req.get('origin');
  return origin === `${req.protocol}://${req.get('host')}`;
}

const safeReturn = (value) => (typeof value === 'string' && /^\/(?!\/)[\w\-./?=&#%]*$/.test(value) ? value : '/leren');

export function accountApi() {
  const api = express.Router();
  // Only these paths; /api/v1 (the content API) is handled by React Router.
  api.use(['/auth', '/me'], (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!pool) return res.status(503).json({error: 'unavailable'});
    next();
  }, express.json({limit: '1mb'}));

  // Looks up the learner; `required` answers 401 without one.
  const who = (required) => async (req, res, next) => {
    const {token, cookie} = sessionToken(req);
    if (cookie && req.method !== 'GET' && token && !sameOrigin(req)) return res.status(403).json({error: 'origin'});
    try {
      req.userId = await sessionUser(token);
    } catch (error) {
      return next(error);
    }
    req.sessionToken = token;
    req.viaCookie = cookie;
    if (required && !req.userId) return res.status(401).json({error: 'signed-out'});
    next();
  };

  const signedIn = async (req, res, userId) => {
    const token = await createSession(userId);
    const user = await profile(userId);
    if (req.body?.client === 'app') return res.json({token, user});
    res.cookie(COOKIE, token, cookieOptions(req));
    res.json({user});
  };

  // MARK: Apple (native sheet in the app, Sign in with Apple JS on the website)
  api.post('/auth/apple', who(false), async (req, res) => {
    const {idToken, nonce, name, link} = req.body || {};
    let identity;
    try {
      identity = await verifyApple(String(idToken || ''), String(nonce || ''));
    } catch {
      return res.status(401).json({error: 'invalid-token'});
    }
    if (link && !req.userId) return res.status(401).json({error: 'signed-out'});
    const userId = await signInIdentity(identity, link ? req.userId : null, typeof name === 'string' ? name.slice(0, 120) || null : null);
    if (link) return res.json({user: await profile(userId)});
    await signedIn(req, res, userId);
  });

  // MARK: Google (OpenID Connect with the ID token posted back to us, so no client secret)
  api.get('/auth/google', who(false), async (req, res) => {
    const mode = req.query.mode === 'app' ? 'app' : 'web';
    let linkUser = null;
    if (mode === 'app' && req.query.ticket) linkUser = await useCode('link', String(req.query.ticket));
    if (mode === 'web' && req.query.link === '1') linkUser = req.userId;
    const state = randomToken(24);
    const nonce = randomToken(24);
    await cleanUp();
    await pool.query('insert into auth_requests(state,nonce,mode,link_user,return_to) values($1,$2,$3,$4,$5)', [state, nonce, mode, linkUser, safeReturn(req.query.return)]);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.search = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID, redirect_uri: `${PUBLIC_ORIGIN}/api/auth/google/callback`, response_type: 'id_token',
      response_mode: 'form_post', scope: 'openid email profile', state, nonce, prompt: 'select_account',
    }).toString();
    res.redirect(303, url.toString());
  });

  api.post('/auth/google/callback', express.urlencoded({extended: false, limit: '20kb'}), async (req, res) => {
    const {state, id_token: idToken, error} = req.body || {};
    const {rows: [request]} = await pool.query(`delete from auth_requests where state=$1 and created_at > now() - interval '15 minutes' returning nonce,mode,link_user,return_to`, [String(state || '')]);
    const back = request?.return_to || '/leren';
    const fail = (reason) => request?.mode === 'app'
      ? res.redirect(303, `${APP_CALLBACK}?error=${reason}`)
      : res.redirect(303, `${back}${back.includes('?') ? '&' : '?'}login=${reason}`);
    if (!request) return fail('expired');
    if (error || !idToken) return fail('cancelled');
    let identity;
    try {
      identity = await verifyGoogle(String(idToken), request.nonce);
    } catch {
      return fail('failed');
    }
    const userId = await signInIdentity(identity, request.link_user);
    if (request.mode === 'app') {
      // Linking from the app keeps its current session; a new sign-in gets a one-time code to exchange.
      if (request.link_user) return res.redirect(303, `${APP_CALLBACK}?linked=google`);
      return res.redirect(303, `${APP_CALLBACK}?code=${encodeURIComponent(await createCode('login', userId))}`);
    }
    if (!request.link_user) res.cookie(COOKIE, await createSession(userId), cookieOptions(req));
    res.redirect(303, back);
  });

  /** The app trades the one-time code from the Google redirect for a session token. */
  api.post('/auth/exchange', async (req, res) => {
    const userId = await useCode('login', String(req.body?.code || ''));
    if (!userId) return res.status(401).json({error: 'invalid-code'});
    res.json({token: await createSession(userId), user: await profile(userId)});
  });

  /** A one-time ticket so the app can add Google to the signed-in account in the browser sheet. */
  api.post('/auth/link-ticket', who(true), async (req, res) => res.json({ticket: await createCode('link', req.userId)}));

  api.post('/auth/signout', who(false), async (req, res) => {
    await endSession(req.sessionToken);
    res.clearCookie(COOKIE, {path: '/'});
    res.json({ok: true});
  });

  // MARK: The learner

  api.get('/me', who(false), async (req, res) => res.json({user: req.userId ? await profile(req.userId) : null}));

  api.delete('/me', who(true), async (req, res) => {
    await pool.query('delete from users where id=$1', [req.userId]);
    res.clearCookie(COOKIE, {path: '/'});
    res.json({ok: true});
  });

  api.delete('/me/identities/:provider', who(true), async (req, res) => {
    const {rows: [{count}]} = await pool.query('select count(*)::int as count from identities where user_id=$1', [req.userId]);
    if (count < 2) return res.status(409).json({error: 'last-sign-in'});
    await pool.query('delete from identities where user_id=$1 and provider=$2', [req.userId, req.params.provider]);
    res.json({user: await profile(req.userId)});
  });

  api.get('/me/progress', who(true), async (req, res) => {
    const [cards, events, prefs] = await Promise.all([
      pool.query('select card_id,ease::float8 as ease,interval_days,repetitions,due,last_reviewed,grade,reviews from review_cards where user_id=$1 limit 5000', [req.userId]),
      pool.query('select id,card_id,grade,reviewed_at from review_events where user_id=$1 order by reviewed_at desc limit 2000', [req.userId]),
      pool.query('select data,updated_at from learning_preferences where user_id=$1', [req.userId]),
    ]);
    res.json({cards: cards.rows, events: events.rows, preferences: prefs.rows[0] || null});
  });

  /** Same rules as before: the newest review of a card wins, answers are only added. */
  api.post('/me/sync', who(true), async (req, res) => {
    const cards = Array.isArray(req.body?.cards) ? req.body.cards : [];
    const events = Array.isArray(req.body?.events) ? req.body.events : [];
    if (cards.length > 5000 || events.length > 5000) return res.status(413).json({error: 'too-large'});
    const latest = new Map();
    for (const card of cards) if (!latest.has(card?.id) || String(latest.get(card.id).lastReviewed) < String(card.lastReviewed)) latest.set(card?.id, card);
    try {
      await pool.query(
        `insert into review_cards(user_id,card_id,ease,interval_days,repetitions,due,last_reviewed,grade,reviews)
         select $1,x.id,x.ease,x.interval,x.repetitions,x.due,x."lastReviewed",x.grade,x.reviews
         from jsonb_to_recordset($2::jsonb) as x(id text,ease numeric,interval int,repetitions int,due timestamptz,"lastReviewed" timestamptz,grade int,reviews int)
         on conflict(user_id,card_id) do update set ease=excluded.ease,interval_days=excluded.interval_days,repetitions=excluded.repetitions,
           due=excluded.due,last_reviewed=excluded.last_reviewed,grade=excluded.grade,reviews=excluded.reviews
         where review_cards.last_reviewed < excluded.last_reviewed`, [req.userId, JSON.stringify([...latest.values()])]);
      await pool.query(
        `insert into review_events(user_id,id,card_id,grade,reviewed_at)
         select $1,x.id,x."cardId",x.grade,x.at from jsonb_to_recordset($2::jsonb) as x(id uuid,"cardId" text,grade int,at timestamptz)
         on conflict do nothing`, [req.userId, JSON.stringify(events)]);
    } catch {
      return res.status(400).json({error: 'invalid-progress'});
    }
    res.json({ok: true});
  });

  api.put('/me/preferences', who(true), async (req, res) => {
    const {data, updated_at: updatedAt} = req.body || {};
    if (!data || typeof data !== 'object' || Array.isArray(data) || !updatedAt) return res.status(400).json({error: 'invalid'});
    try {
      await pool.query(
        `insert into learning_preferences(user_id,data,updated_at) values($1,$2,$3)
         on conflict(user_id) do update set data=excluded.data,updated_at=excluded.updated_at where learning_preferences.updated_at < excluded.updated_at`,
        [req.userId, JSON.stringify(data), updatedAt]);
    } catch {
      return res.status(400).json({error: 'invalid'});
    }
    res.json({ok: true});
  });

  api.use((error, _req, res, _next) => {
    console.error('account api', error?.message || error);
    res.status(500).json({error: 'server'});
  });
  return api;
}
