// The path: every situation (theme) in order from A0 to B1, each with five steps that connect
// what belongs together — words, sentences, the grammar you need there, the conversation, and a final game.
// Everything is computed from the normal review history, so it follows you between web and iPhone.
import {path as sections} from '../../content/index.js';
import {themes, vocabulary} from './learning-data.js';
import {phrases} from './phrase-data.js';
import {sentences} from './sentence-data.js';
import {planSession, resumeTheme} from './learning-model.js';
import {progressStatus} from './srs.js';
import {irregularRound, irregularSet} from './irregular.js';
import {patternDrill} from '../lib/drill.ts';

/** Finishing a theme's conversation (half or more right) is saved as this review, so it syncs like everything else. */
export const conversationId = (themeId) => `gesprek:${themeId}`;

export const pathSections = sections.map((section) => ({...section, themes: section.themes.map((id) => themes.find((theme) => theme.id === id)).filter(Boolean)}));
export const pathThemes = pathSections.flatMap((section) => section.themes);

const wordsOf = (id) => vocabulary.filter((card) => card.themeId === id);
const phrasesOf = (id) => phrases.filter((card) => card.themeId === id);
const rulesOf = (theme) => (theme.grammar ?? []).map((ruleId) => sentences.find((card) => card.id === ruleId)).filter(Boolean);
const practised = (list, reviews) => list.filter((card) => reviews[card.id]).length;

/** The situations a grammar rule (or an Onregelmatig set) is needed in, in path order. */
export const themesForRule = (ruleId) => pathThemes.filter((theme) => theme.grammar?.includes(ruleId));
export const themesForIrregular = (setId) => pathThemes.filter((theme) => theme.irregular === setId);

/** The five steps of one situation, with how far you are in each. */
export function themeSteps(themeId, reviews) {
  const theme = themes.find((item) => item.id === themeId);
  if (!theme) return [];
  const words = wordsOf(themeId), sentenceCards = phrasesOf(themeId), rules = rulesOf(theme);
  const irregular = theme.irregular ? irregularSet(theme.irregular) : null;
  // An Onregelmatig set counts once you have played a round of it (or all of it, if it is short).
  const irregularDone = irregular ? practised(irregular.cards, reviews) >= Math.min(10, irregular.cards.length) : true;
  const all = [...words, ...sentenceCards];
  const known = all.filter((card) => progressStatus(reviews[card.id]) === 'known').length;
  const steps = [
    {id: 'woorden', title: 'Woorden', detail: `${words.length} woorden`, done: practised(words, reviews), total: words.length},
    {id: 'zinnen', title: 'Handige zinnen', detail: `${sentenceCards.length} zinnen`, done: practised(sentenceCards, reviews), total: sentenceCards.length},
    {id: 'grammatica', title: 'Grammatica', detail: `${rules.length} ${rules.length === 1 ? 'regel' : 'regels'}${irregular ? ' + onregelmatige vormen' : ''} voor deze situatie`,
      done: practised(rules, reviews) + (irregular && irregularDone ? 1 : 0), total: rules.length + (irregular ? 1 : 0), rules, irregular},
    {id: 'gesprek', title: 'Gesprek', detail: 'Kies wat jij zegt', done: reviews[conversationId(themeId)] ? 1 : 0, total: 1},
    // The final game is done when most of the situation is well remembered (like 3 stars).
    {id: 'eindspel', title: 'Eindspel', detail: 'Alles door elkaar, tot je het kent', done: Math.min(known, Math.ceil(all.length * 0.8)), total: Math.ceil(all.length * 0.8)},
  ];
  return steps.map((step, index) => ({...step, number: index + 1, complete: step.total > 0 && step.done >= step.total}));
}

/** The first step that is not finished yet, or null when the situation is complete. */
export const nextStep = (steps) => steps.find((step) => !step.complete) ?? null;
export const themeComplete = (themeId, reviews) => !nextStep(themeSteps(themeId, reviews));

/** Where a learner of this level starts: A0 (or unknown) at the beginning, A2 and B1 at their section. */
function levelStart(level) {
  if (!level || level === 'A0') return 0;
  const index = pathThemes.findIndex((theme) => (level === 'B1' ? theme.level === 'B1' : theme.level !== 'A0'));
  return Math.max(0, index);
}

/** The situation you are on: the one you practised last if it is not finished, else the next unfinished one from your level. */
export function currentTheme(reviews, events, level = null) {
  if (events.length) {
    const last = resumeTheme(events);
    if (pathThemes.some((theme) => theme.id === last) && !themeComplete(last, reviews)) return last;
  }
  const start = levelStart(level);
  const ordered = [...pathThemes.slice(start), ...pathThemes.slice(0, start)];
  return (ordered.find((theme) => !themeComplete(theme.id, reviews)) ?? pathThemes[0]).id;
}

/**
 * What a step starts: a practice round (cards, plus `drill` for grammar patterns), an Onregelmatig round, or a game.
 * Rounds are ten cards; a finished step can be played again.
 */
export function stepRound(themeId, stepId, reviews) {
  const theme = themes.find((item) => item.id === themeId);
  if (!theme) return null;
  if (stepId === 'woorden') return {kind: 'round', queue: planOrRepeat(wordsOf(themeId), reviews, () => planSession(reviews, {theme: themeId, type: 'woorden', limit: 10}))};
  if (stepId === 'zinnen') return {kind: 'round', queue: planOrRepeat(phrasesOf(themeId), reviews, () => planSession(reviews, {theme: themeId, type: 'praktisch', limit: 10}))};
  if (stepId === 'grammatica') {
    const rules = rulesOf(theme);
    const fresh = rules.find((rule) => !reviews[rule.id]);
    if (fresh) return {kind: 'round', drill: true, queue: patternDrill({...fresh, themeId: 'zinsbouw'}), label: fresh.title};
    const irregular = theme.irregular ? irregularSet(theme.irregular) : null;
    if (irregular && practised(irregular.cards, reviews) < Math.min(10, irregular.cards.length)) return {kind: 'irregular', set: irregular.id, label: irregular.title, queue: irregularRound(irregular.id, reviews)};
    // Everything practised: two exercises of every rule, mixed.
    return {kind: 'round', drill: true, queue: rules.flatMap((rule) => patternDrill({...rule, themeId: 'zinsbouw'}).slice(0, 3)).slice(0, 10)};
  }
  if (stepId === 'gesprek') return {kind: 'game', game: 'gesprek'};
  // Eindspel: the cards of this situation you know least, words, sentences and its grammar together.
  const pool = [...wordsOf(themeId), ...phrasesOf(themeId), ...rulesOf(theme).map((rule) => ({...rule, themeId: 'zinsbouw'}))];
  const score = (card) => {
    const review = reviews[card.id];
    if (!review) return -1;
    return progressStatus(review) === 'known' ? 10 + review.repetitions : review.grade + review.repetitions;
  };
  return {kind: 'round', queue: [...pool].sort((a, b) => score(a) - score(b)).slice(0, 12)};
}

// Due and new cards first; when everything is practised, the ones practised longest ago.
function planOrRepeat(list, reviews, plan) {
  const queue = plan();
  if (queue.length) return queue;
  return list.filter((card) => reviews[card.id]).sort((a, b) => new Date(reviews[a.id].lastReviewed) - new Date(reviews[b.id].lastReviewed)).slice(0, 10);
}
