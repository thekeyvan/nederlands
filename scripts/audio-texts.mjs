import {baseVocabulary} from '../content/words.js';
import {basePhrases} from '../content/phrases.js';
import {baseSentences} from '../content/grammar.js';
import {baseDialogues} from '../content/dialogues.js';
export const sampleText='Goedemorgen! Ik leer Nederlands. Op woensdag werk ik thuis. Hoe gaat het met je?';
export const audioTexts=[...new Set([
 ...baseVocabulary.flatMap(word=>[word.nl,word.example]),
 ...basePhrases.map(phrase=>phrase.nl),
 ...baseSentences.map(sentence=>sentence.example),
 ...baseDialogues.flatMap(dialogue=>dialogue.lines.map(line=>line.nl)),
 sampleText
])].filter(Boolean);
if(process.argv[1]&&new URL(import.meta.url).pathname===process.argv[1])process.stdout.write(JSON.stringify({texts:audioTexts,sampleText}));
