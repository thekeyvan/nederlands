// Extra example sentences per grammar rule, so one rule gives a short round of exercises.
// Each entry: [Dutch sentence, the word left out in a gap exercise, Persian translation, optional hint].
import {grammarFiles} from './index.js';

export const grammarExamples = Object.fromEntries(grammarFiles.map((rule) => [rule.id, rule.examples.map(({nl, gap, fa, hint}) => (hint ? [nl, gap, fa, hint] : [nl, gap, fa]))]));
