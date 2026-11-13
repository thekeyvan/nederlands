import {baseSentences} from './content/grammar.js';
import {translateCard} from './i18n.js';
export const sentences=baseSentences.map(card=>translateCard(card));
