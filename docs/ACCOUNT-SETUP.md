# Accounts (Apple and Google) for your fork

A fresh fork is local-only: without `DATABASE_URL` the site keeps progress on the device. Accounts need three things.

## 1. A Postgres database

On Railway: add a Postgres service and give the web service `DATABASE_URL=${{Postgres.DATABASE_URL}}`. The server applies `server/schema.sql` at every start (it only creates what is missing). Run the account tests against a throwaway database with `TEST_DATABASE_URL=postgres://… npm test`.

## 2. Google

Create an OAuth **Web application** client in Google Cloud. Add your site as JavaScript origin and `https://YOUR-SITE/api/auth/google/callback` as redirect URI, and set `GOOGLE_CLIENT_ID` (public) on the server. The sign-in uses the OpenID Connect ID token posted back to that URL, so the client secret is never needed. The iPhone app opens `/api/auth/google?mode=app` in a Safari sheet and receives a one-time code on `com.keyvanmahmoudi.nederlands://auth`.

## 3. Apple

Enable Sign in with Apple on the app's App ID, and create a Services ID for the website with your domain and the return URL `https://YOUR-SITE/leren`. Put both identifiers in `APPLE_CLIENT_IDS` in `server/auth.mjs` and the Services ID in `src/core/cloud.js`. Group the Services ID under the app's primary App ID, so Apple gives the website and the app the same user id. No key or secret is needed: the app's native sheet and Sign in with Apple JS both return an ID token that the server checks.

## How accounts work

- One learner can have an Apple and a Google sign-in (`identities`). A new sign-in with a verified email that another sign-in already uses joins that learner; Apple's hidden relay addresses never match. Under Instellingen a learner links the other provider; if that sign-in already had its own progress, both are merged (the newest review of each card wins).
- Sessions are random tokens; only their SHA-256 hash is stored. The website gets an httpOnly cookie, and requests that change data must come from the site's own origin. The app keeps its token in the Keychain.
- Deleting the account removes the learner and, through foreign keys, every sign-in, session and saved answer.

Before sharing, update `app/routes/site/privacy.tsx` with your own operator, contact and data location.
