# Contributing

Small improvements are welcome: clearer A2–B1 wording, corrected translations, a new theme or a new translation language. Open a pull request with the change and its purpose.

## Content map

| File | Contents |
| --- | --- |
| `content/themes.js` | Permanent theme IDs, Dutch titles and introductions |
| `content/words.js` | Words, expressions, examples and Dutch verb forms |
| `content/phrases.js` | Practical sentence cards, level and theme ID |
| `content/dialogues.js` | Role-play lines, speaker labels and stable line IDs |
| `content/grammar.js` | Dutch patterns, examples and gap-fill questions |
| `locales/<code>.js` | Translations keyed by the same IDs |
| `data.js` | The Dutch resource library and exercises |
| `theme-phrases.js` | Practical sentence and dialogue rendering |
| `i18n.js` | Language selection, text direction and fonts |
| `srs.js` | Pure review scheduler |

## Add a theme

1. Give it a permanent ID in `content/themes.js` and a short Dutch title/intro.
2. Add words with explicit stable IDs, a theme ID, `nl` text and `kind`: `woord`, `werkwoord` or `uitdrukking`. Verbs include three `forms`: past, perfect and a short Dutch description. Every word and expression includes a natural Dutch usage example, with its translation in every registered language pack.
3. Add at least five practical sentences to `content/phrases.js`, each with a stable ID, `themeId`, `nl`, `kind: 'zin'` and A2/B1 level.
4. Add a coherent dialogue with at least four lines. Give every line a permanent ID and a Dutch speaker label. Write natural questions and answers, not disconnected vocabulary examples.
5. Add the theme name, meanings, grammar explanations and dialogue translations to every registered language pack.

A phrase looks like:

```js
{id:'phrase:your-theme:01', themeId:'your-theme', nl:'Kan ik een afspraak maken?', level:'A2', kind:'zin'}
```

Translate it under `cards['phrase:your-theme:01'].meaning`. IDs are used in local and cloud progress; correcting the sentence must not change its ID. A genuinely different learning objective gets a new ID. Existing card IDs must remain available or get an explicit migration; the baseline fixture protects the original 500.

## Validate

```sh
npm ci
npm test
npm run build
npm run dev
```

Check desktop and a narrow phone layout. Test keyboard focus, opening translations, RTL/LTR direction, a practice round and local persistence. Auth changes also need a real Google sign-in and an owner-isolation database test in your own project. Do not commit user records, course screenshots, account tokens or secret keys.

The automated checks verify translation coverage, stable IDs, themes/dialogues, mixed-script separation and scheduling. GitHub Actions runs them for pull requests. Add only content you may share under the project's license; links to outside resources do not relicense those resources.
