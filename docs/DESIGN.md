# Learning experience

The app opens with a short daily practice action and a continuation based on real review history. Themes are visible cards, grouped and searchable in Dutch or the selected translation language. A topic keeps words, practical sentences and a conversation in separate views.

Word details use a native modal dialog, rendered as a sheet on phones. Examples, translations and verb forms stay next to the selected word. Escape closes the dialog and restores focus. Previous/next controls avoid reopening a different card. The original word web remains an optional view.

A practice round has one task at a time, a real card counter, four recall ratings and a completion summary. Due cards still use the existing SM-2 schedule. Fresh mixed rounds alternate words and practical sentences. Space reveals an answer; 1–4 rate it. These shortcuts do not intercept input fields or modal dialogs.

Conversation practice can hide the learner's lines, which can be revealed individually. Audio uses the browser's speech synthesis and a Dutch voice, when available; no speech or microphone is recorded. Browser/device voice availability varies. The interface reports when a Dutch voice is unavailable.

Progress uses actual review events and the last seven calendar days in the learner's local timezone. Empty themes are hidden initially. There are no invented streaks, XP points or proficiency claims.

## Design references

The Dutch cream, orange and navy identity is retained. Navigation, button hierarchy, focus styles and modal presentation were informed by the public [Better Design](https://github.com/marvkr/better-design) Notion component sources:

- `components/notion/components/ui/sidebar.tsx`
- `components/notion/components/ui/button.tsx`
- `components/notion/components/ui/dialog.tsx`

These patterns were adapted to native HTML/CSS, rather than introducing React or shadcn into the static app. Better Design's MCP service was not connected; its live principles and automated review tools were not used. The repository's skill explicitly requires a user-reviewed setup for that service.

Icons are a consistent, locally vendored subset of [Lucide](https://lucide.dev), with their [license](../assets/icons/LICENSE). The buildings and music assets are stored under compatibility names; their source icons are `building.svg` and `keyboard-music.svg`.

## Entries and content

`index.html` is the single app template. The build also serves it at `/leren.html` for existing links and Google callbacks. `bronnen.html` keeps the original learning resource collection, saved sources and weekly tasks. Old `/#bronnen` and `/#week` links forward to the matching resource sections.

App behavior is split between `leren.js` (routing), `discovery.js`, `word-dialog.js`, `review-ui.js`, `learning-dashboard.js` and `grammar-ui.js`. `learning-model.js` contains testable session, activity and theme helpers. Translations remain in language packs and stable content IDs remain unchanged.
