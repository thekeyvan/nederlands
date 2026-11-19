// Onregelmatig: irregular verbs, plurals, comparisons and present-tense forms you learn by heart.
// Every form is one review card ("onr:…") with the normal SM-2 schedule, so what you miss comes back.
// New forms are chosen from four options with typical learner mistakes; forms you know are typed.
import data from '../../content/irregular.json' with {type: 'json'};
import {slug} from '../../content/ids.js';
import {normalizeAnswer, seededRandom, shuffle} from './practice.js';
import {irregularVerbWhy, setWhy} from './why.js';

const prefixed = /^(be|ge|ver|ont|her|er)/;
const kofschip = new Set(['t', 'k', 'f', 's', 'h', 'p', 'x']);
const vowels = 'aeiou';

/** The stem as in "ik …": lopen → loop, zwemmen → zwem, blijven → blijf. `original` is the letter before v→f and z→s. */
function stemOf(infinitive) {
  let stem = infinitive.endsWith('en') ? infinitive.slice(0, -2) : infinitive.slice(0, -1);
  const [a, b] = [stem.at(-2), stem.at(-1)];
  if (a === b && !vowels.includes(b)) stem = stem.slice(0, -1);
  else if (/(^|[^aeiou])[aeiou][^aeiouj]$/.test(stem)) stem = stem.slice(0, -1) + stem.at(-2) + stem.at(-1);
  const original = stem.at(-1);
  if (original === 'v') stem = stem.slice(0, -1) + 'f';
  if (original === 'z') stem = stem.slice(0, -1) + 's';
  return {stem, original};
}
const ending = (last, voiced, voiceless) => (kofschip.has(last) ? voiceless : voiced);
/** The form a learner makes when they treat a strong verb as regular. */
export function regularForms(infinitive) {
  const {stem, original} = stemOf(infinitive);
  const last = original === 'v' || original === 'z' ? 'd' : original;
  const past = stem + ending(last, 'de', 'te');
  const participle = withGe(infinitive, stem + (/[td]$/.test(stem) ? '' : ending(last, 'd', 't')));
  const present = stem.endsWith('t') ? stem : `${stem}t`;
  return {stem, past, participle, present};
}

// ge- before e or i takes a trema: geëten. Verbs with be-, ver-, ont- … get no ge-.
const withGe = (infinitive, form) => (prefixed.test(infinitive) ? form : /^[ei]/.test(form) ? `ge${form[0] === 'e' ? 'ë' : 'ï'}${form.slice(1)}` : `ge${form}`);
const answersOf = (form) => {
  const [aux, ...rest] = form.split(' ');
  return aux.includes('/') ? aux.split('/').map((one) => [one, ...rest].join(' ')) : [form];
};
function choices(id, answer, accepted, wrong, whyOf = () => null) {
  const seen = new Set(accepted.map(normalizeAnswer));
  const options = [{label: answer, correct: true, why: whyOf(answer, true)}];
  for (const label of wrong) {
    const key = normalizeAnswer(label);
    if (!label || seen.has(key)) continue;
    seen.add(key);
    options.push({label, correct: false, why: whyOf(label, false)});
    if (options.length === 4) break;
  }
  return shuffle(options, seededRandom(`${id}:form`));
}

function verbCards(set, item) {
  const regular = regularForms(item.nl);
  const perfects = answersOf(item.perfect);
  const [aux, ...rest] = perfects[0].split(' ');
  const participle = rest.join(' ');
  const other = aux === 'heeft' ? 'is' : 'heeft';
  const chain = [item.nl, item.past, item.perfect];
  const base = {themeId: 'onregelmatig', set: set.id, themeTitle: set.title, title: item.nl, meaning: item.fa, chain, labels: ['werkwoord', 'verleden tijd', 'voltooide tijd'], rule: set.fa, pattern: set.pattern, mode: 'form'};
  const pastId = item.ids?.past ?? `onr:${slug(item.nl)}:verleden`;
  const perfectId = item.ids?.perfect ?? `onr:${slug(item.nl)}:deelwoord`;
  const pastWrong = item.wrongPast ?? [regular.past, item.pastPlural, regular.present, participle];
  const perfectWrong = item.wrongPerfect ?? [
    perfects.length > 1 ? null : `${other} ${participle}`,
    `${aux} ${regular.participle}`,
    `${aux} ${withGe(item.nl, item.nl)}`,
    // ge- + the past: "gebleefd". Not for verbs with a regular past (lachte), where it makes no sense.
    regular.past === item.past ? null : `${aux} ${withGe(item.nl, item.past + (/[td]$/.test(item.past) ? '' : ending(item.past.at(-1), 'd', 't')))}`,
    `${other} ${regular.participle}`,
  ];
  const past = [item.past, ...(item.accept ?? [])];
  const facts = {verb: item.nl, past: item.past, pastPlural: item.pastPlural, perfect: perfects[0], regular};
  return [
    {...base, id: pastId, ask: 1, nl: item.past, answer: item.past, accept: past, choices: choices(pastId, item.past, past, pastWrong, (label, correct) => irregularVerbWhy(facts, 1, label, correct)), note: `${item.nl} · ${item.past} (${item.pastPlural}) · ${item.perfect}`},
    {...base, id: perfectId, ask: 2, nl: perfects[0], answer: perfects[0], accept: perfects, choices: choices(perfectId, perfects[0], perfects, perfectWrong, (label, correct) => irregularVerbWhy(facts, 2, label, correct)), note: `${item.nl} · ${item.past} (${item.pastPlural}) · ${item.perfect}`},
  ];
}

function otherCards(set, item) {
  const base = {themeId: 'onregelmatig', set: set.id, themeTitle: set.title, title: item.nl, meaning: item.fa, rule: set.fa, pattern: set.pattern, mode: 'form'};
  if (set.kind === 'present') {
    const id = item.id ?? `onr:nu:${slug(item.prompt)}`;
    const accept = [item.answer, ...(item.accept ?? [])];
    const example = item.prompt.replace('___', item.answer);
    return [{...base, id, nl: item.answer, answer: item.answer, accept, prompt: item.prompt, example, choices: choices(id, item.answer, accept, item.wrong, () => setWhy(set.title, set.fa)), note: example}];
  }
  if (set.kind === 'plural') {
    const id = item.id ?? `onr:${slug(item.nl)}:meervoud`;
    const accept = [item.answer, ...(item.accept ?? [])];
    return [{...base, id, ask: 1, chain: [item.nl, item.answer], labels: ['enkelvoud', 'meervoud'], nl: item.answer, answer: item.answer, accept, choices: choices(id, item.answer, accept, item.wrong, () => setWhy(set.title, set.fa)), note: `${item.nl} · ${item.answer}`}];
  }
  const chain = [item.nl, item.more, item.most];
  const labels = ['bijvoeglijk naamwoord', 'vergrotende trap', 'overtreffende trap'];
  const note = `${item.nl} · ${item.more} · ${item.most}`;
  return [['meer', 1, item.more, item.wrongMore], ['meest', 2, item.most, item.wrongMost]].map(([form, ask, answer, wrong]) => {
    const id = item.ids?.[form] ?? `onr:${slug(item.nl)}:${form}`;
    return {...base, id, ask, chain, labels, nl: answer, answer, accept: [answer], choices: choices(id, answer, [answer], wrong, () => setWhy(set.title, set.fa)), note};
  });
}

/** The sets in the order they are shown: verbs first, then the other irregular things. */
export const irregularSets = data.sets.map((set) => {
  const cards = set.items.flatMap((item) => (set.kind === 'verb' ? verbCards(set, item) : otherCards(set, item)));
  const rows = set.kind === 'verb' ? set.items.map((item) => ({id: item.nl, cells: [item.nl, item.past, item.perfect], fa: item.fa}))
    : set.kind === 'compare' ? set.items.map((item) => ({id: item.nl, cells: [item.nl, item.more, item.most], fa: item.fa}))
      : set.kind === 'plural' ? set.items.map((item) => ({id: item.nl, cells: [item.nl, item.answer], fa: item.fa}))
        : set.items.map((item) => ({id: item.prompt, cells: [item.nl, item.prompt.replace('___', item.answer)], fa: item.fa}));
  return {id: set.id, kind: set.kind, group: set.kind === 'verb' ? 'werkwoorden' : 'meer', title: set.title, pattern: set.pattern, level: set.level, rule: set.fa, cards, rows};
});
export const irregularCards = irregularSets.flatMap((set) => set.cards);
/** One line (Persian) about how to learn them. */
export const irregularIntro = data.fa;
export const irregularSet = (id) => irregularSets.find((set) => set.id === id) ?? null;

/** True when a typed answer matches; an answer without its hebben/zijn is close. */
export function checkForm(input, card) {
  const given = normalizeAnswer(input);
  if (!given) return {result: 'wrong'};
  if (card.accept.some((answer) => normalizeAnswer(answer) === given)) return {result: 'correct'};
  if (card.ask === 2 && card.set && irregularSet(card.set)?.kind === 'verb' && card.accept.some((answer) => normalizeAnswer(answer.split(' ').slice(1).join(' ')) === given)) return {result: 'close', hint: 'aux'};
  return {result: 'wrong'};
}

// Stars like a theme: half practised, everything practised, 80% well remembered.
const stars=({total,done,known})=>!total?0:known/total>=0.8?3:done>=total?2:done/total>=0.5?1:0;

/** Progress of one set, with stars like a theme. */
export function irregularProgress(set, reviews, now = new Date()) {
  const total = set.cards.length;
  const done = set.cards.filter((card) => reviews[card.id]).length;
  const known = set.cards.filter((card) => reviews[card.id]?.repetitions >= 3 && reviews[card.id].grade >= 3).length;
  const due = set.cards.filter((card) => reviews[card.id] && new Date(reviews[card.id].due) <= now).length;
  return {total, done, known, due, stars: stars({total, done, known})};
}

/**
 * A round of ten: forms that are due first, then new ones in order (a verb's past before its participle),
 * then the ones practised longest ago. For all sets together: only forms you have practised.
 */
export function irregularRound(setId, reviews, {now = new Date(), limit = 10} = {}) {
  const pool = setId === 'all' ? irregularCards : (irregularSet(setId)?.cards ?? []);
  const due = pool.filter((card) => reviews[card.id] && new Date(reviews[card.id].due) <= now).sort((a, b) => new Date(reviews[a.id].due) - new Date(reviews[b.id].due));
  const fresh = setId === 'all' ? [] : pool.filter((card) => !reviews[card.id]);
  const rest = pool.filter((card) => reviews[card.id] && new Date(reviews[card.id].due) > now).sort((a, b) => new Date(reviews[a.id].lastReviewed) - new Date(reviews[b.id].lastReviewed));
  const queue = [...due, ...fresh, ...rest].slice(0, limit);
  if (queue.length || setId !== 'all') return queue;
  return irregularSets[0].cards.slice(0, limit);
}

/** New forms are chosen; after two good answers you type them. */
export const formInput = (review) => ((review?.repetitions ?? 0) >= 2 ? 'type' : 'choose');
