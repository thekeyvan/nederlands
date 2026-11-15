# Adding content

All lessons live in `content/` as plain JSON, with the Dutch and the Persian side by side. The website, the content API (`/api/v1`) and the iPhone app read the same files, and the games make their rounds from them automatically.

```text
content/
  index.js            the course: which files exist, their order, and the theme groups
  ids.js              how ids are made (never change this)
  themes/<id>.json    one theme: words, handy phrases, a short dialogue
  grammar/<id>.json   one grammar rule: explanation and example sentences
  schema/             JSON Schemas (your editor and AI tools use them for autocomplete and checks)
  course.js           the route: eight stops that combine themes and rules
  placement.json      the niveautest: five questions per level (A0, A1, A2, B1)
```

After any change run:

```sh
npm run content:check   # explains every problem with file and place
npm test
```

## A new word

Open the theme file and add an object to `words`:

```json
{
  "nl": "de afspraak",
  "kind": "woord",
  "fa": "قرار ملاقات",
  "example": "Ik heb morgen een afspraak bij de huisarts.",
  "exampleFa": "فردا پیش پزشک خانواده وقت دارم."
}
```

- `kind` is `woord`, `werkwoord` or `uitdrukking`. Nouns start with `de` or `het`; the De of het? game uses that.
- Verbs add `"forms": ["had", "heb gehad", "onregelmatig"]` (past, perfect, regular or irregular); the Werkwoorden game uses them.
- The example is a natural A2–B1 sentence that contains the word.

That is all: the word appears on the website, in the API, in practice rounds, the Tijdrace, De of het?, dictation and Woorden practice.

## A new phrase or dialogue line

```json
{"nl": "Kan ik een afspraak maken?", "level": "A2", "fa": "می‌توانم وقت بگیرم؟"}
```

Dialogue lines have `speaker`, `nl` and `fa`. The learner is always `"Jij"`; a dialogue has 4–6 lines that answer each other. Phrases feed Zinnen bouwen and Zinnen aanvullen; dialogues feed Gesprekken.

## A new theme

1. Copy a theme file, e.g. `content/themes/huisarts.json`, to `content/themes/<new-id>.json`. The id is lower case with hyphens, the same as the file name, and never changes.
2. Fill in `title` (Dutch), `fa`, `intro` (one Dutch question), `level` (`A0`, `A1` or `B1`; leave it out for A2), about 20–30 words, 5+ phrases and a dialogue. Beginner themes (A0) go in the `beginnen` group; learners with that level see them first.
3. In `content/index.js`: add an import line, add it to `themeFiles` and put its id in one of the `groups`.
4. Optional: a square 3D picture at `src/assets/illustrations/themes/<new-id>.jpg` (about 520 px, same style as the others). Without one the apps show the logo.
5. Run `npm run content:check`.

## A new grammar rule

Copy a file in `content/grammar/`. The `id` is `zin:` plus the file name. `prompt` has exactly one `___` where `answer` goes. Give at least three `examples`; each `gap` is a whole word that appears exactly once in its sentence (it is hidden in the gap exercise). Then import it in `content/index.js` and add it to `grammarFiles`.

## The niveautest and levels

`content/placement.json` holds the level test: five questions per level, from easy (A0) to hard (B1). A block counts as passed with `passMark` (4) right answers, and the test stops at the first block that is not passed; that level becomes the learner's level (B1 after passing every block). Each question has a `kind` (`meaning`, `fill` with one `___`, or `understand`), a Dutch `prompt`, four `options` and the right `answer`. The apps shuffle the options.

The learner's level is saved with their settings (and synced with their account). It puts themes of that level first in Leren, suggests three unfinished themes on Oefenen/Vandaag, and picks the first theme for a new learner. The rules are in `src/core/level.js` (website) and `LevelPlan` in the iPhone app.

## Audio

Every Dutch sentence has a recorded clip in two voices. New text has no clip until you run the generator (see [AUDIO.md](AUDIO.md)); until then the apps simply hide the listen button for it. `npm run content:check` tells you how many clips are missing.

## Rules that keep progress safe

- Ids are stored with every learner's progress. They are made from the theme id and the Dutch (`werk:de-balans`, `phrase:werk:03`). Fixing a typo in `nl` would change the id, so when you fix the Dutch of an existing word add `"id": "<the old id>"` to keep it. Never reorder existing phrases or dialogue lines; add new ones at the end.
- Never delete a theme or rule that learners may have practised; hide it from a group instead if needed.
- Persian goes in `fa`, `exampleFa` and `fa.*`; Dutch fields contain no Persian (the check enforces both).

## Asking an AI to write content

Give it this file and the schema, and ask for one complete JSON file at a time, for example:

> Write `content/themes/fietsen.json` for Nedfa, following docs/CONTENT.md and content/schema/theme.schema.json: 24 everyday A2–B1 words about cycling in the Netherlands (nouns with de/het, verbs with forms), 6 handy phrases and a 5-line dialogue where the learner is "Jij". Natural Dutch, short Persian (Farsi) translations.

Then add it to `content/index.js` and run `npm run content:check`.

## After merging

Railway deploys `main` automatically: the website and `/api/v1` show the new content within minutes. The iPhone app downloads the new version on its next launch (`/api/v1/version` changes), and the next App Store build bundles it (`npm run build:native`).
