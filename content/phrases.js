// Handy sentences of every theme, read from content/themes/*.json.
import {themeFiles} from './index.js';
import {phraseId} from './ids.js';

export const basePhrases = themeFiles.flatMap((theme) =>
  theme.phrases.map((phrase, index) => ({id: phraseId(theme, phrase, index), themeId: theme.id, nl: phrase.nl, level: phrase.level, kind: 'zin'})),
);
