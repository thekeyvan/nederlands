// Grammar rules (Zinsbouw), read from content/grammar/*.json.
import {grammarFiles} from './index.js';

export const baseSentences = grammarFiles.map(({id, title, level, pattern, example, prompt, answer}) => ({id, title, level, pattern, example, prompt, answer}));
