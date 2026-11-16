// Sign in with Apple and Google without a third-party auth service.
// Both send a signed ID token; we check it against the provider's public keys, so no client secret is needed.
import {createHash, randomBytes} from 'node:crypto';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import {pool, transaction} from './db.mjs';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '330338517367-vo621l562vhjkih8ieaeahflkhvs049j.apps.googleusercontent.com';
// Apple gives every app and Services ID of one team the same user id, so the app and the website share accounts.
// nl.nedfa is the new iPhone app; the com.keyvanmahmoudi.nederlands IDs stay until the old app and website Services ID are gone.
export const APPLE_CLIENT_IDS = ['nl.nedfa', 'nl.nedfa.web', 'com.keyvanmahmoudi.nederlands', 'com.keyvanmahmoudi.nederlands.web'];
// Where Google sign-in returns to in the app: the new app sends `app=nl.nedfa`; older builds send nothing.
export const APP_CALLBACKS = {'nl.nedfa': 'nl.nedfa://auth', 'com.keyvanmahmoudi.nederlands': 'com.keyvanmahmoudi.nederlands://auth'};
export const appCallback = (app) => APP_CALLBACKS[app] || APP_CALLBACKS['com.keyvanmahmoudi.nederlands'];
const SESSION_DAYS = 180;

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sha256 = (text) => createHash('sha256').update(text).digest('hex');
const truthy = (value) => value === true || value === 'true';

export async function verifyGoogle(idToken, nonce) {
  const {payload} = await jwtVerify(idToken, googleKeys, {issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: GOOGLE_CLIENT_ID});
  if (payload.nonce !== nonce) throw new Error('nonce');
  return {provider: 'google', subject: String(payload.sub), email: payload.email ? String(payload.email) : null, emailVerified: truthy(payload.email_verified), name: payload.name ? String(payload.name) : null};
}

/** `rawNonce` is what the client generated; Apple signs its SHA-256 hash. */
export async function verifyApple(idToken, rawNonce) {
  const {payload} = await jwtVerify(idToken, appleKeys, {issuer: 'https://appleid.apple.com', audience: APPLE_CLIENT_IDS});
  if (!rawNonce || payload.nonce !== sha256(rawNonce)) throw new Error('nonce');
  // Relay addresses ("Hide My Email") are real but never match another account.
  return {provider: 'apple', subject: String(payload.sub), email: payload.email ? String(payload.email) : null, emailVerified: truthy(payload.email_verified) && !truthy(payload.is_private_email), name: null};
}

// MARK: Accounts

/**
 * Finds or creates the learner for a verified sign-in.
 * - Known sign-in: its learner.
 * - `linkUserId` (adding Apple or Google from Ik): attached to that learner; if the sign-in already had
 *   its own learner, the two are merged so nothing is lost.
 * - New sign-in with a verified email that another sign-in already uses: the same learner.
 * - Otherwise a new learner.
 */
export async function signInIdentity(identity, linkUserId = null, name = null) {
  return transaction(async (db) => {
    const displayName = identity.name || name || null;
    const {rows: [existing]} = await db.query('select user_id from identities where provider=$1 and subject=$2 for update', [identity.provider, identity.subject]);
    let userId = existing?.user_id || null;

    if (linkUserId) {
      if (userId && userId !== linkUserId) await mergeUsers(db, userId, linkUserId);
      else if (!userId) await db.query('insert into identities(provider,subject,user_id,email) values($1,$2,$3,$4)', [identity.provider, identity.subject, linkUserId, identity.email]);
      userId = linkUserId;
    } else if (!userId && identity.email && identity.emailVerified) {
      const {rows: [match]} = await db.query(
        `select id from users where lower(email)=lower($1)
         union select user_id from identities where lower(email)=lower($1)
         limit 1`, [identity.email]);
      if (match) {
        userId = match.id;
        await db.query('insert into identities(provider,subject,user_id,email) values($1,$2,$3,$4)', [identity.provider, identity.subject, userId, identity.email]);
      }
    }
    if (!userId) {
      const {rows: [created]} = await db.query('insert into users(email,name) values($1,$2) returning id', [identity.email, displayName]);
      userId = created.id;
      await db.query('insert into identities(provider,subject,user_id,email) values($1,$2,$3,$4)', [identity.provider, identity.subject, userId, identity.email]);
    }
    if (identity.email) await db.query('update identities set email=$3 where provider=$1 and subject=$2', [identity.provider, identity.subject, identity.email]);
    await db.query('update users set email=coalesce(email,$2), name=coalesce(name,$3) where id=$1', [userId, identity.email, displayName]);
    return userId;
  });
}

/** Moves everything from one learner to another (newest review of each card wins) and removes the first. */
async function mergeUsers(db, from, into) {
  await db.query(
    `insert into review_cards(user_id,card_id,ease,interval_days,repetitions,due,last_reviewed,grade,reviews)
     select $2,card_id,ease,interval_days,repetitions,due,last_reviewed,grade,reviews from review_cards where user_id=$1
     on conflict(user_id,card_id) do update set ease=excluded.ease,interval_days=excluded.interval_days,repetitions=excluded.repetitions,
       due=excluded.due,last_reviewed=excluded.last_reviewed,grade=excluded.grade,reviews=excluded.reviews
     where review_cards.last_reviewed < excluded.last_reviewed`, [from, into]);
  await db.query(
    `insert into review_events(user_id,id,card_id,grade,reviewed_at)
     select $2,id,card_id,grade,reviewed_at from review_events where user_id=$1 on conflict do nothing`, [from, into]);
  await db.query(
    `insert into learning_preferences(user_id,data,updated_at) select $2,data,updated_at from learning_preferences where user_id=$1
     on conflict(user_id) do update set data=excluded.data,updated_at=excluded.updated_at where learning_preferences.updated_at < excluded.updated_at`, [from, into]);
  await db.query('update identities set user_id=$2 where user_id=$1', [from, into]);
  await db.query('update users set name=coalesce(users.name,old.name), email=coalesce(users.email,old.email) from users old where users.id=$2 and old.id=$1', [from, into]);
  await db.query('delete from users where id=$1', [from]);
}

// MARK: Sessions and one-time codes

export async function createSession(userId) {
  const token = randomToken();
  await pool.query(`insert into sessions(token_hash,user_id,expires_at) values($1,$2,now() + interval '${SESSION_DAYS} days')`, [sha256(token), userId]);
  return token;
}

/** The learner for a session token, or null. Sessions renew themselves while in use. */
export async function sessionUser(token) {
  if (!token || token.length > 100) return null;
  const hash = sha256(token);
  const {rows: [row]} = await pool.query('select user_id, expires_at < now() + interval \'150 days\' as renew from sessions where token_hash=$1 and expires_at > now()', [hash]);
  if (!row) return null;
  if (row.renew) await pool.query(`update sessions set expires_at=now() + interval '${SESSION_DAYS} days' where token_hash=$1`, [hash]);
  return row.user_id;
}

export const endSession = (token) => token ? pool.query('delete from sessions where token_hash=$1', [sha256(token)]) : null;

export async function createCode(kind, userId) {
  const code = randomToken();
  await pool.query('insert into auth_codes(code_hash,kind,user_id) values($1,$2,$3)', [sha256(code), kind, userId]);
  return code;
}

/** Uses up a one-time code (valid for five minutes) and returns its learner. */
export async function useCode(kind, code) {
  if (!code || code.length > 100) return null;
  const {rows: [row]} = await pool.query(`delete from auth_codes where code_hash=$1 and kind=$2 and created_at > now() - interval '5 minutes' returning user_id`, [sha256(code), kind]);
  return row?.user_id || null;
}

export async function cleanUp() {
  await pool.query(`delete from auth_requests where created_at < now() - interval '15 minutes'`);
  await pool.query(`delete from auth_codes where created_at < now() - interval '15 minutes'`);
  await pool.query('delete from sessions where expires_at < now()');
}

export async function profile(userId) {
  const {rows: [user]} = await pool.query('select id,email,name from users where id=$1', [userId]);
  if (!user) return null;
  const {rows} = await pool.query('select provider,email from identities where user_id=$1 order by created_at', [userId]);
  return {id: user.id, name: user.name || '', email: user.email || rows.find((row) => row.email)?.email || '', providers: rows.map((row) => row.provider)};
}
