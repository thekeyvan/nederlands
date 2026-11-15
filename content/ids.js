// How ids are made from the content. Ids are stored with your progress, so they must never change:
// a word keeps its id even if its spelling is fixed later (then the file sets "id" explicitly).
/** The id part made from a Dutch word: lower case, no accents, words joined with hyphens. */
export const slug = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const wordId = (theme, word) => word.id ?? `${theme.id}:${slug(word.nl)}`;
export const phraseId = (theme, phrase, index) => phrase.id ?? `phrase:${theme.id}:${String(index + 1).padStart(2, '0')}`;
export const lineId = (theme, line, index) => line.id ?? `dialogue:${theme.id}:${index + 1}`;
