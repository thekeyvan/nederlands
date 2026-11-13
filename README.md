# Mijn Nederlands

A small, open-source Dutch learning site for A2–B1, with translations in your own language. Built with plain HTML, CSS and JavaScript. [Live example](https://nederlands.keyvanmahmoudi.com).

- 20 themed word webs with 506 words and expressions, each with a Dutch usage example and Persian translation
- 105 practical sentences and 20 short role-play conversations, including the GP, pharmacy and municipality
- 30 grammar patterns, recall practice and SM-2 spaced repetition
- A complete Persian translation pack, including RTL and Vazirmatn; extensible language packs
- Browser-only progress by default; optional Google sign-in and private Supabase sync
- 53 learning resources and four bookstore links

## Run your own copy

Requires Node.js 22+ and Python 3 for the example development server.

```sh
npm ci
npm test
npm run dev
```

Open http://localhost:8080. A fresh fork works without an account or external database. `npm run build` creates `dist/`; any static host can serve that folder. Only the application and assets are copied, not SQL, tests, contributor documents or environment files.

## Add your language

```sh
npm run locale:new -- es
```

Translate `locales/es.js`, set the language name, Dutch language name, direction and font, then import/register it in `locales/index.js`. Set `defaultLocale` in `site.config.js` if desired. When several complete packs are registered, a language selector appears. The `?lang=es` parameter also selects a registered pack. See [the translation guide](docs/TRANSLATING.md).

The navigation stays in simple Dutch: Dutch is the language being learned. Meanings, example translations, grammar explanations and secondary learning hints come from the selected pack. Persian is the only complete bundled pack today. Adding a pack changes the learner's translation language, not the target language.

## Add themes or sentences

Dutch content lives in `content/`; translations live in `locales/`. Every theme has words, practical sentences and a dialogue. Every review card has a permanent ID: do not regenerate IDs when changing its wording. Existing accounts keep their progress after content updates. See [CONTRIBUTING.md](CONTRIBUTING.md) for the file map and checks.

## Optional Google account sync

Use **your own** Supabase and Google Cloud projects. The repository contains no active default backend configuration. Set these two public deployment environment variables before building:

```text
PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR-PUBLIC-KEY
```

`npm run build` generates `dist/deployment-config.json`, which is public by design. Never put a service-role key, database password or Google client secret there. `.env` files are ignored, and the build does not load them automatically. Export values in your shell, or configure them in your host's environment settings. [Full account setup](docs/ACCOUNT-SETUP.md).

Vercel reads the included build and output settings. With another host, serve `dist/` and configure equivalent security headers. The supplied CSP allows connections to Supabase project domains; narrow it to your own backend if preferred. Preview deployments have account sync off unless you explicitly configure their environment too.

## Progress and privacy

Scheduling uses SM-2: quality grades 1, 3, 4 and 5; successful intervals of 1 day, 6 days, then the previous interval multiplied by ease and rounded up. Failure resets successful repetitions and schedules tomorrow. Ease is bounded to 1.3–10; intervals to 100 years. Three successive correct recalls count as well remembered, an estimate rather than a language qualification. Due cards come first, followed by at most five new cards, with a 20-card round limit.

Progress is tied to stable content IDs, independent of the translation language. Local caches are separated by account. With optional sync, owner-scoped RLS protects cards, review events and preferences. Offline work retries later; newer review timestamps win. Preference edits are timestamp-based, not collaborative editing. Local review history is capped at 2,000 events; cloud history is retained. Adapt `privacy.html` to your own operator, contact method and infrastructure before publishing your fork.

## License and sources

[MIT](LICENSE) covers the original code, illustrations and original learning content in this repository. You may fork, modify and share it, including commercially, while retaining the license notice. Linked websites, books, logos and third-party materials retain their own rights; the license does not grant rights to their content. The vendored Supabase SDK has its own [MIT notice](assets/supabase.LICENSE.txt).

The resource collection was inspired by Regina Coeli's study advice. The core learning topics were rewritten from Dutch lessons; the practical dialogues were written for this project. No private chat transcripts, course screenshots, access codes or personal financial details are included. The site is independent and is not an official Regina Coeli product.
