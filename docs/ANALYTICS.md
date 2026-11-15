# Analytics (Umami)

Nedfa counts visits with [Umami](https://umami.is) 3.4.1, self-hosted on Railway. It sets no cookies, stores no IP addresses and never links counts to an account. Learners can turn it off in Instellingen; on the web Do Not Track and Global Privacy Control also turn it off.

## How it runs

| Piece | Where |
| --- | --- |
| Umami app | Railway service `umami` (image `ghcr.io/umami-software/umami:3.4.1`), private address `umami.railway.internal:3000` |
| Umami database | Railway service `Postgres-xWqn`, separate from the learners' database (`Postgres`) |
| Collect endpoint | `https://nedfa.nl/stats/api/send` → `server/stats.mjs` forwards it to Umami over the private network |
| Website id | `0cbc91c6-7ae2-4c9a-9851-d005214361fa` (in `src/lib/stats.ts` and `ios-native/Nedfa/Services/Analytics.swift`) |
| Dashboard | the `umami` service's own Railway domain (Settings → Networking) |

Umami's variables: `DATABASE_URL=${{Postgres-xWqn.DATABASE_URL}}`, `APP_SECRET` and `TWO_FACTOR_ENCRYPTION_KEY` (random, generated once), `DISABLE_TELEMETRY=1`, `PORT=3000`.

Because everything goes through nedfa.nl, the website's Content-Security-Policy stays `'self'` and ad blockers that block third-party trackers don't change the numbers much. If Umami is down, `/stats/api/send` answers 202 and the site carries on.

## What is counted

Page views: every public page (path only), and app screens as `/leren/<screen>[/<theme|rule|game>]` on the web and `/ios/<screen-name>` in the iPhone app (the same names as feedback reports).

Events (never anything the learner typed):

| Event | Data |
| --- | --- |
| `niveautest` | `niveau` (A0–B1), `overgeslagen` (chose "Ik begin bij nul") |
| `ronde klaar` | `soort`, `kaartjes`, `goed` |
| `spel klaar` | `spel`, `score` |
| `inloggen` / `koppelen` | `provider` (apple or google), counted when the learner starts it |
| `feedback` | `soort` (idee, probleem, compliment, anders) |

Debug builds of the iPhone app and the website on any host other than nedfa.nl send nothing.

## Adding an event

Web: `trackEvent('naam', {key: value})` from `src/lib/stats.ts`. iPhone: `Analytics.shared.event("naam", ["key": value])`. Use the same name on both, add it to the table above, and keep the data to counts and fixed choices.

## Dashboard login

Umami starts with the user `admin` / password `umami`. Change it right after the first login (Settings → Profile → Change password), or better, create your own admin user and delete `admin`.
