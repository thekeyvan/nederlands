# Translation packs

The target language is Dutch. Each pack adds a learner's language for meanings, explanations and hints. `fa` is the complete reference pack.

## Create and register a pack

```sh
npm run locale:new -- es
```

This creates `locales/es.js` with the complete key structure and blank translations. It refuses to overwrite an existing file. Fill in:

- `code`: BCP 47 language code matching the registry key
- `name`: name in your language, e.g. `Español`
- `dutchName`: name used in Dutch sentences, e.g. `Spaans`
- `dir`: `ltr` or `rtl`
- `font`: CSS font family; use a font covering your script
- `themes`: translated theme titles
- `cards`: word/sentence `meaning`, example `translation`, grammar `rule`/`note`
- `dialogues`: translations of individual dialogue lines
- `ui`: secondary hints and the four review ratings

Keep an empty example translation only when the Dutch card has no example. Translate every other required field, then register it:

```js
// locales/index.js
import fa from './fa.js';
import es from './es.js';
export const locales = {fa, es};
```

Set `{defaultLocale:'es'}` in `site.config.js` for a Spanish-first fork. With multiple packs, the language dropdown appears automatically. `leren.html?lang=es&thema=huisarts` selects Spanish and the GP theme. Invalid language parameters fall back to the configured default. Each registered pack must pass `npm test` before publication.

## Direction and typography

Only translation elements change language and direction. Dutch questions, verb forms, navigation and dialogue speaker labels stay LTR. Translated elements receive `lang`, `dir` and the pack's font. Do not reverse whole pages or insert raw HTML in translations. Text is rendered with `textContent`.

The default stylesheet loads Vazirmatn for Persian. If your language needs another web font, add it to the stylesheet and update the font/style origins in your host's CSP if necessary. A locally hosted font is also possible.

## Missing translations and progress

Missing secondary hints fall back to simple Dutch, never automatically to Persian. Missing content translations remain empty so an incomplete pack cannot silently mislabel a different language. Coverage tests prevent registering an incomplete pack for release. Changing language preserves progress because scheduling uses language-independent Dutch card IDs.

The main interface and resource descriptions intentionally remain in simple Dutch. Supporting a different *target* language would require replacing the Dutch learning content, examples and interface as well; that is outside the translation-pack contract.
