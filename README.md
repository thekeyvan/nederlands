# Mijn Nederlands

A2–B1 Dutch learning site at https://nederlands.keyvanmahmoudi.com.

- 53 source entries from the study advice file plus its four bookstore links
- Dutch orange/navy styling, canal-house illustration, responsive layouts
- 17 word webs with 470 Dutch words/phrases and Persian meanings
- 30 sentence patterns with Persian explanations and recall exercises
- SM-2 spaced repetition: due items first, at most five new cards per 20-card round
- Local progress without login; Google OAuth and private Supabase progress sync
- Saved sources and weekly tasks, including account-specific browser caches

## Files

`data.js` is the source library. `learning-data.js` contains vocabulary and verb forms. `sentence-data.js` contains grammar cards. Content was rewritten from the language-learning topics discussed on 9–12 November 2026; original chat transcripts, images, access codes and personal financial details are not published.

`srs.js` is a pure SM-2 scheduler. UI answers map to grades 1, 3, 4 and 5. Correct answers use 1 day, then 6 days, then the previous interval multiplied by ease, rounded up. A failed answer resets the successful repetition count and returns in one day. Ease has a floor of 1.3; practical storage bounds cap ease at 10 and intervals at 100 years. Three successive successful answers count as well remembered; this is an estimate, not a language certification.

## Development

Serve the repository with a static server, e.g. `python3 -m http.server 8080`.

Run `npm test`. No compilation is needed for the application. The exact Supabase SDK version and vendor build dependencies are pinned in the lockfile. After updating the SDK, run `node scripts/vendor.mjs` and commit `assets/supabase.js`.

## Hosting

Vercel project `nederlands`, team `the-keyvan`, publishes `main` automatically. Cloudflare manages the domain DNS. `vercel.json` sets security headers. The site uses only its public Supabase publishable key; no service-role key, database password or Google client secret belongs in this repository.

## Supabase

Organization: `nederlands-keyvanmahmoudi`. Project reference: `ggeiftrasvframzrgccf` (London, Free).

`database/schema.sql` documents the deployed schema. `database/verify-rls.sql` is a rollback-only integration check: own writes succeed, another user's cards remain invisible, and changing ownership is rejected. All exposed tables have owner-scoped RLS. Anonymous access has no table grants. The sync function uses SECURITY INVOKER and derives the owner from `auth.uid()`.

Google sign-in is enabled; other providers, including email/password, are disabled. Google Cloud project `xenon-container-514607-f4` uses an external production OAuth web client with basic email/profile access only. A real Google sign-in and review save were verified on 13 November 2026. Origin: `https://nederlands.keyvanmahmoudi.com`. Google callback: `https://ggeiftrasvframzrgccf.supabase.co/auth/v1/callback`. Supabase Site URL is the production origin; allowed application redirect is `https://nederlands.keyvanmahmoudi.com/leren.html`. Enable only the Google sign-in provider. Google credentials stay in Supabase's provider settings.

User records include review scheduling, up to 2,000 recent review events in local cache, saved source IDs and weekly task IDs. Cloud review history is retained in the database. Local caches are separated by user. Offline work retries when connectivity returns or the page becomes visible. Newer review records win when merging; preferences follow their edit timestamp. Simultaneous edits on different devices are not a collaborative editing system.
