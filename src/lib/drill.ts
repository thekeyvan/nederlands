import type {Card} from '../core/types.ts';
import {examplesFor, type GrammarExample} from '../core/grammar-examples.js';
import {builderItem} from '../core/games.js';
import {seededRandom, shuffle} from '../core/practice.js';
import {ruleWhy} from '../core/why.js';

const endPunctuation = /[.?!…]+$/;
const bare = (token: string) => token.replace(/^[„“"'(]+|[.,!?;:…"”')]+$/g, '');
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The sentence with the practised word replaced by a gap. */
function gapPrompt(example: GrammarExample) {
  const prompt = example.nl.replace(new RegExp(`(^|[^\\p{L}])${escape(example.gap)}(?=[^\\p{L}]|$)`, 'u'), '$1___');
  return example.hint ? `${prompt} (${example.hint})` : prompt;
}

/** Wrong word orders for "Kies de zin": the practised word moved to other places in the sentence. */
export function orderVariants(sentence: string, word: string, count = 3) {
  const ending = (sentence.match(endPunctuation) || [''])[0];
  const tokens = sentence.replace(endPunctuation, '').split(/\s+/);
  const index = tokens.findIndex((token) => bare(token) === word);
  if (index < 0 || tokens.length < 3) return [];
  const rest = tokens.filter((_, position) => position !== index);
  const moved = index === 0 ? tokens[index].toLowerCase() : tokens[index];
  const order = [index + 1, index - 1, index + 2, index - 2, rest.length, 0, index + 3, index - 3].filter((position, at, list) => position >= 0 && position <= rest.length && position !== index && list.indexOf(position) === at);
  const variants: string[] = [];
  for (const position of order) {
    const list = [...rest.slice(0, position), moved, ...rest.slice(position)];
    if (index !== 0 && position === 0) list[1] = list[1].toLowerCase();
    list[0] = list[0].charAt(0).toUpperCase() + list[0].slice(1);
    const text = list.join(' ') + ending;
    if (text !== sentence && !variants.includes(text)) variants.push(text);
    if (variants.length === count) break;
  }
  return variants;
}

/**
 * "Oefen dit patroon": six short exercises about one pattern, made from its example sentences.
 * Fill the gap, put the words in order, and choose the sentence with the right word order.
 */
export function patternDrill(card: Card): Card[] {
  const examples = examplesFor(card.id);
  const base: Card = {...card, themeId: 'zinsbouw'};
  const make = (example: GrammarExample | undefined, mode: 'gap' | 'order' | 'pick'): Card | null => {
    if (!example) return null;
    const exercise: Card = {...base, example: example.nl, translation: example.translation || card.translation, prompt: gapPrompt(example), answer: example.gap, mode};
    if (mode === 'order' && !builderItem(exercise, example.nl)) return {...exercise, mode: 'gap'};
    if (mode === 'pick' && orderVariants(example.nl, example.gap).length < 2) return {...exercise, mode: 'gap'};
    return exercise;
  };
  const [first, second, third] = examples;
  const list = [
    card.prompt?.includes('___') ? {...base, mode: 'gap' as const} : null,
    make(first, 'order'),
    make(second, 'pick'),
    make(third, 'gap'),
    make(third, 'order'),
    make(first, 'pick'),
  ].filter(Boolean) as Card[];
  return list.length ? list : [base];
}

/** Shuffled tiles and the given first word for an order exercise. */
export const orderItem = (card: Card) => builderItem(card, card.example, `${card.id}:${card.example}`);
export const pickOptions = (card: Card) => {
  const random = seededRandom(`${card.id}:${card.example}:pick`);
  const why = ruleWhy(card);
  return shuffle([{id: 'right', label: card.example!, correct: true, why}, ...orderVariants(card.example!, card.answer!).map((label, index) => ({id: `wrong-${index}`, label, correct: false, why}))], random);
};
