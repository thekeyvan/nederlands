# Contributing

Small improvements are welcome: clearer A2–B1 wording, corrected translations, a new theme or a new translation language. Open a pull request with the change and its purpose.

## Content map

| File | Contents |
| --- | --- |
| `content/themes/<id>.json` | One theme: words (with examples and verb forms), handy phrases and a dialogue, Dutch and Persian side by side |
| `content/grammar/<id>.json` | One grammar rule: pattern, Persian explanation and example sentences |
| `content/index.js` | The course: which theme and grammar files exist, their order and the theme groups |
| `content/ids.js` | How permanent ids are made from the content |
| `locales/<code>.js` | Interface translations; lesson translations come from the content files |
| `src/core/data.js` | The Dutch resource library and exercises |
| `src/core/srs.js` | Pure SM-2 review scheduler |
| `src/core/learning-model.js` | Pure session, activity and theme helpers |
| `src/core/game.js` | Streak, XP, levels, stars, stamps, missions and route progress (derived, never stored) |
| `src/core/practice.js` | Practice modes, answer options, typed-answer checking and grade mapping |
| `src/core/games.js` | Rounds for the study games, learner-mistake distractors and personal bests |
| `src/games/` | The seven study games and their shared shell |
| `src/core/i18n.js` | Language pack selection, text direction and fonts |
| `src/core/*.d.ts` | Types for the plain-JS core, used by the React UI |
| `src/screens/` | Vandaag, Thema’s, Oefenen, Zinsbouw, De route, Ik and Bronnen |
| `src/components/ui/` | shadcn/ui components (Button has an extra `game` variant) |
| `src/components/game/` | Mascot, stamps, stars, goal ring, confetti and game cards |
| `src/index.css` | Theme tokens for light and dark mode |
| `src/assets/illustrations/` | Theme scenes, mascot poses, stamps and the route map |
| `app/` | Website (React Router 8, server rendering), content API at `/api/v1`, and the `/leren` app route |
| `ios-native/` | Native SwiftUI iPhone app |

## Add content

See [docs/CONTENT.md](docs/CONTENT.md): adding a word, phrase, theme or grammar rule is one JSON edit, checked with `npm run content:check`. IDs are used in local and cloud progress; correcting a sentence must not change its ID.

## Validate

```sh
npm ci
npm test
npm run build
npm run dev
```

Check desktop and a narrow phone layout, in light and dark mode. Test keyboard focus, opening translations, RTL/LTR direction, a practice round in each mode and local persistence. Auth changes also need a real Google sign-in and an owner-isolation database test in your own project. Do not commit user records, course screenshots, account tokens or secret keys.

The automated checks verify translation coverage, stable IDs, themes/dialogues, mixed-script separation and scheduling. GitHub Actions runs them for pull requests. Add only content you may share under the project's license; links to outside resources do not relicense those resources.
