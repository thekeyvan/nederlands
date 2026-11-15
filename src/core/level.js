// The learner's level (from the niveautest) and what it changes: which themes come first and where a new learner starts.
// Pure functions, shared by the website and (through the content export) the iPhone app.
import placement from '../../content/placement.json' with {type: 'json'};

export const LEVELS = ['A0', 'A1', 'A2', 'B1'];
export const levelInfo = {
  A0: {name: 'Beginnen', fa: 'شروع از صفر', text: 'Je begint bij het begin: groeten, getallen en de eerste zinnen.'},
  A1: {name: 'Basis', fa: 'پایه', text: 'Je kent de basis. Nu bouw je eenvoudige zinnen over je dag en je omgeving.'},
  A2: {name: 'Op weg', fa: 'در مسیر', text: 'Je redt je in het dagelijks leven. Nu oefen je werk, wonen, zorg en de gemeente.'},
  B1: {name: 'Zelfstandig', fa: 'مستقل', text: 'Je spreekt al goed. Nu werk je aan lange zinnen, meningen en het inburgeringsexamen.'},
};
export const validLevel = (value) => (LEVELS.includes(value) ? value : null);

/** The test questions, grouped by level in test order. */
export const placementQuestions = placement.questions;
export const passMark = placement.passMark;

/**
 * The starting level after the test: the first level whose block was not passed,
 * or B1 when every block was passed. `answers` maps a level to the number of right answers in its block.
 */
export function placementResult(answers) {
  for (const level of LEVELS) if ((answers[level] ?? 0) < passMark) return level;
  return 'B1';
}

/** True when the test can stop: the current block is answered and not passed. */
export function placementDone(level, right, asked) {
  const block = placementQuestions.filter((question) => question.level === level).length;
  return asked >= block ? true : right + (block - asked) < passMark;
}

/** Theme levels in the order that suits a learner (closest first); without a level the course order stays. */
export function levelOrder(level) {
  return {A0: ['A0', 'A1', 'A2', 'B1'], A1: ['A0', 'A1', 'A2', 'B1'], A2: ['A2', 'A1', 'B1', 'A0'], B1: ['B1', 'A2', 'A1', 'A0']}[level] ?? null;
}

/** Themes with the ones for this level first; keeps the course order within a level. */
export function sortForLevel(themes, level) {
  const order = levelOrder(level);
  if (!order) return themes;
  const rank = (theme) => order.indexOf(theme.level ?? 'A2');
  return themes.map((theme, index) => ({theme, index})).sort((a, b) => rank(a.theme) - rank(b.theme) || a.index - b.index).map(({theme}) => theme);
}

/** Up to `count` themes that fit the level and are not finished yet. `progress(id)` returns {done, total}. */
export function suggestedThemes(themes, level, progress, count = 3) {
  return sortForLevel(themes, level).filter((theme) => {
    const {done = 0, total = 1} = progress(theme.id) ?? {};
    return done < total;
  }).slice(0, count);
}

/** Where a learner without practice history starts. */
export function startTheme(themes, level) {
  return sortForLevel(themes, level)[0]?.id ?? themes[0]?.id;
}
