# Public site and SEO

The public pages are for Persian speakers (mainly Iranians, also Afghans) who want to learn Dutch. Every page exists
in Persian at `/…` (`lang="fa" dir="rtl"`) and in Dutch at `/nl/…`, linked with `hreflang` (x-default: Persian).
Dutch words are marked `lang="nl" dir="ltr"`, Persian fragments on Dutch pages `lang="fa" dir="rtl"`.

`scripts/site/build-site.mjs` writes them after `vite build`, from the same content files as the app
(`content/*.js` and the Persian pack in `locales/`). Adding a theme or grammar pattern adds its page, sitemap
entry and llms.txt line automatically. The app itself lives at `/leren.html` and is `noindex`.

| URL | Page | Main search terms |
| --- | --- | --- |
| `/` | Landing page | آموزش زبان هلندی, یادگیری زبان هلندی, آموزش زبان هلندی به فارسی, اپلیکیشن آموزش زبان هلندی, آموزش هلندی رایگان |
| `/woorden/` | 32 themes | لغات هلندی, لغات هلندی به فارسی, کلمات پرکاربرد هلندی, واژگان هلندی |
| `/woorden/<theme>/` | Words, phrases and a dialogue per theme | لغات هلندی + topic (در سوپرمارکت, پیش پزشک, کار …), جملات کاربردی هلندی, مکالمه هلندی |
| `/grammatica/` | 48 patterns | گرامر زبان هلندی, دستور زبان هلندی, de یا het |
| `/grammatica/<pattern>/` | One pattern with examples | the Dutch term itself (omdat, perfectum, scheidbare werkwoorden …) + گرامر هلندی |
| `/inburgering/` | Exam guide | آزمون اینبورخرینگ, آزمون هم‌پذیری هلند, امتحان زبان هلندی A2, امتحان B1 هلندی |

Keyword notes (November 2026 research):

- Persian searches use both «آموزش زبان هلندی» and «یادگیری زبان هلندی»; the landing title and H1 carry the first,
  the description the second. Competing pages (Maktabkhooneh: `/learn/dutch/`, `/learn/dutch-grammar/`,
  `/learn/dutch-words/`, `/learn/dutch-conversation/`) confirm the clusters: general, grammar, words, conversation.
- Few Persian pages list Dutch words with Persian meanings, so the 32 theme pages are the long-tail opportunity.
- Most "learn Dutch" apps are English-only; "به فارسی" and "برای فارسی‌زبانان" are the differentiators in titles.
- Inburgering facts change: the guide gives the stable parts (four language skills, B1 under the Wet inburgering
  2021 for people who started on or after 1 January 2022, A2 before) and sends readers to inburgeren.nl and DUO for
  costs and dates. Check it once a year.

Technical setup:

- Each page: unique `<title>` and description, canonical URL, `hreflang="fa"`, Open Graph and Twitter tags,
  breadcrumbs, and JSON-LD (WebSite, Organization, SoftwareApplication, Course and FAQPage on `/`;
  LearningResource and DefinedTermSet on theme pages; LearningResource on grammar pages; Article and FAQPage on
  the exam guide). No ratings or reviews are claimed.
- `robots.txt` allows all search engines and AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot,
  PerplexityBot, Google-Extended, Applebot-Extended …) and points to `sitemap.xml`.
- `llms.txt` summarises the site for AI assistants; `llms-full.txt` holds all words, phrases, dialogues and
  grammar in plain text.
- Pages are static HTML with one small script (light/dark theme); no content depends on JavaScript.
- Images: the 3D mascot scenes from the app (themes, games, sections), `src/site/img/hero.webp`, `inburgering.webp`,
  `logo.png` and the share images `og.jpg` / `inburgering-og.jpg`, all made with Codex image generation.

Search Console: the `nedfa.nl` domain property is verified with a DNS TXT record in Cloudflare; the sitemap
`https://nedfa.nl/sitemap.xml` is submitted there.
