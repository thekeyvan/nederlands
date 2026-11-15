# Nedfa: notes for AI agents

Nedfa teaches Dutch (A2–B1) to Persian speakers. One repository holds everything:

- `content/`: all lessons as JSON (Dutch + Persian side by side). **Read [docs/CONTENT.md](docs/CONTENT.md) before adding or changing content.**
- `app/`: the website, React Router 8 with server rendering (Dutch at `/`, Persian at `/fa/`), plus the content API at `/api/v1`.
- `src/`: the practice web app at `/leren` (React 19, renders in the browser) and the shared domain logic in `src/core/`.
- `ios-native/`: the native SwiftUI iPhone app. `npm run build:native` exports `content.json` from `content/` and generates the Xcode project.
- `server.mjs`: the production server on Railway, which deploys `main` automatically. `server/` holds accounts (Sign in with Apple and Google, one account for both) and progress sync on Railway Postgres; see [docs/ACCOUNT-SETUP.md](docs/ACCOUNT-SETUP.md).
- Analytics: anonymous Umami on Railway, collected through `https://nedfa.nl/stats` (`server/stats.mjs`); see [docs/ANALYTICS.md](docs/ANALYTICS.md). Never send anything the learner typed or an account id.

## Content rules

1. One theme = `content/themes/<id>.json`; one grammar rule = `content/grammar/<id>.json`; register new files in `content/index.js`.
2. Ids are made from the Dutch (see `content/ids.js`) and are stored with learners' progress: never rename theme or rule ids, never reorder existing phrases or dialogue lines, and add `"id"` with the old value when fixing the Dutch of an existing word.
3. Persian only in `fa`, `exampleFa` and `fa.*`; Dutch fields hold Dutch only.
4. Always run `npm run content:check` and `npm test` after changes and fix every error.

## Checks

```sh
npm run content:check
npm test
npm run typecheck
npm run build
```

Commits use the GitHub noreply email `5063636+thekeyvan@users.noreply.github.com`.
