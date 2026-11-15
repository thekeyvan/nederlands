import fa from './fa.js';
import {moreThemes, slug} from '../content/themes-more.js';

// The extra themes keep their Persian next to the Dutch; add it to the Persian pack here.
for (const theme of moreThemes) {
  fa.themes[theme.id] = theme.fa;
  for (const [nl, , , meaning, translation] of theme.words) fa.cards[`${theme.id}:${slug(nl)}`] = {meaning, translation};
  theme.phrases.forEach(([, , meaning], index) => { fa.cards[`phrase:${theme.id}:${String(index + 1).padStart(2, '0')}`] = {meaning}; });
  theme.dialogue.forEach(([, , translation], index) => { fa.dialogues[`dialogue:${theme.id}:${index + 1}`] = translation; });
}

// Import and register complete translation packs here, e.g. {fa, es}.
export const locales = {fa};
