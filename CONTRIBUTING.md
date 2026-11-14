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
| `src/core/data.js` | The Dutch resource library and exercises |
| `src/core/srs.js` | Pure SM-2 review scheduler |
| `src/core/learning-model.js` | Pure session, activity and theme helpers |
| `src/core/game.js` | Streak, XP, levels, stars, stamps, missions and route progress (derived, never stored) |
| `src/core/practice.js` | Practice modes, answer options, typed-answer checking and grade mapping |
| `src/core/i18n.js` | Language pack selection, text direction and fonts |
| `src/core/*.d.ts` | Types for the plain-JS core, used by the React UI |
| `src/screens/` | Vandaag, Thema’s, Oefenen, Zinsbouw, De route, Ik and Bronnen |
| `src/components/ui/` | shadcn/ui components (Button has an extra `game` variant) |
| `src/components/game/` | Mascot, stamps, stars, goal ring, confetti and game cards |
| `src/index.css` | Theme tokens for light and dark mode |
| `src/assets/illustrations/` | Theme scenes, mascot poses, stamps and the route map |
| `index.html` | App entry, also built at `/leren.html` |
| `bronnen.html` | Redirect for old links to the resource collection |

## Add a theme

1. Give it a permanent ID in `content/themes.js` and a short Dutch title/intro.
2. Add words with explicit stable IDs, a theme ID, `nl` text and `kind`: `woord`, `werkwoord` or `uitdrukking`. Verbs include three `forms`: past, perfect and a short Dutch description. Every word and expression includes a natural Dutch usage example, with its translation in every registered language pack.
3. Add at least five practical sentences to `content/phrases.js`, each with a stable ID, `themeId`, `nl`, `kind: 'zin'` and A2/B1 level.
4. Add a coherent dialogue with at least four lines. Give every line a permanent ID and a Dutch speaker label. Write natural questions and answers, not disconnected vocabulary examples.
5. Add the theme name, meanings, grammar explanations and dialogue translations to every registered language pack.
6. Optionally add an illustration at `src/assets/illustrations/themes/<theme-id>.jpg` (square, about 520px). Themes without one show a coloured icon tile.

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

Check desktop and a narrow phone layout, in light and dark mode. Test keyboard focus, opening translations, RTL/LTR direction, a practice round in each mode and local persistence. Auth changes also need a real Google sign-in and an owner-isolation database test in your own project. Do not commit user records, course screenshots, account tokens or secret keys.

The automated checks verify translation coverage, stable IDs, themes/dialogues, mixed-script separation and scheduling. GitHub Actions runs them for pull requests. Add only content you may share under the project's license; links to outside resources do not relicense those resources.
