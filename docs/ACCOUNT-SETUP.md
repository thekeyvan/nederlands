# Optional Google sign-in for your fork

A fresh fork is local-only. It does not connect to the original site's accounts. You can publish the static site without setting up a backend.

## Supabase

1. Create your own project.
2. Run `database/schema.sql` once in its SQL editor. It creates review cards, events and preferences, owner-scoped RLS policies and the `SECURITY INVOKER` sync function. It is an initial schema, not an idempotent upgrade migration.
3. Run `database/verify-rls.sql`. It creates temporary test records inside a transaction, checks ownership and rolls back. Use a clean test project first; do not run scratch SQL in someone else's project.
4. In Authentication → URL Configuration, set Site URL to your deployed origin and allow `https://YOUR-SITE/leren.html` as an exact redirect.
5. Keep anonymous sign-ins and manual linking off. After Google works, disable the email provider if you want Google-only accounts.

## Google Cloud

1. Create a Google Auth application for your own project. Fill in your app name, support contact, homepage and your fork's actual privacy policy. The operator accepts Google's applicable terms.
2. Create an OAuth **Web application** client. Set the JavaScript origin to your deployed site origin and the redirect URI to `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
3. Put its client ID and secret into Supabase's Google provider settings. Leave nonce verification enabled and email required. Do not put the client secret into source code or frontend environment variables.
4. Use only the basic profile/email sign-in scopes. Add test users while testing; complete the Google publishing process before general use. Scope or branding changes can trigger Google's verification requirements.

## Build and deploy

Set `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the **production** environment of your static host, then run `npm run build`. The generated JSON contains public connection settings, not credentials with administrative authority. The build accepts only the Supabase HTTPS project URL and `sb_publishable_` keys.

Vercel uses `vercel.json` automatically. Other hosts serve `dist/` and need their own equivalent security headers. Preview/local builds stay local-only unless you set both variables for that environment. For local OAuth tests, separately allow the exact localhost return URL in Supabase; keep production redirects narrow.

## Verify before sharing

Sign in with Google, review a card, confirm it is stored in your database, then return/reload and confirm the progress remains. Verify one signed-in account cannot read or update another account's rows. Check logout switches to a separate guest cache. Inspect `privacy.html`: replace the original operator/contact information and document your own data location, retention and deletion process.

Local review history is capped at 2,000 events. The cloud table retains history; the client currently loads the 2,000 latest events and up to 1,000 scheduled cards. Expand/paginate those limits before growing beyond 1,000 distinct cards. The current shipped content has 641 review cards.

References: [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
