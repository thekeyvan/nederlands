import {grammarExamples} from '../../content/grammar-examples.js';
import {locale} from './i18n.js';
// Extra sentences per pattern, with the translation for the chosen language when there is one.
export const examplesFor=id=>(grammarExamples[id]||[]).map(([nl,gap,fa,hint])=>({nl,gap,hint,translation:locale.code==='fa'?fa:''}));
export const grammarExampleTexts=Object.values(grammarExamples).flat().map(([nl])=>nl);
