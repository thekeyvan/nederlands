// "Waarom?": why an answer is right or wrong, for every exercise.
// A reason is {tag, fa}: `tag` names the rule in Dutch (a short label), `fa` is one or two Persian sentences
// with the Dutch in **bold**. The same reasons go to the website and, through content.json, to the apps.
// Most reasons come from the kind of mistake an option was made from, the word list or the grammar rule,
// so nothing has to be written per word.
// Same as practice.js (kept here so the two modules do not import each other).
const normalizeAnswer = (text) => String(text || '').toLocaleLowerCase('nl').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[.,!?;:"“”'’()]/g, '').replace(/\s+/g, ' ').trim();

/** Dutch inside Persian text: bold, and isolated so the right-to-left text keeps it in one piece. */
export const nl = (text) => `**⁦${text}⁩**`;
const reason = (tag, fa) => ({tag, fa});
const kofschip = new Set(['t', 'k', 'f', 's', 'p', 'x']);
/** Dutch that is not bold, still kept in one left-to-right piece. */
const ltr = (text) => `\u2066${text}\u2069`;
const KOFSCHIP = ltr('’t kofschip (t, k, f, s, ch, p)');
const inseparable = /^(be|ver|ont|her|ge|er)/;
const separable = /^(aan|af|bij|door|in|langs|mee|na|om|op|over|samen|terug|thuis|toe|uit|vast|voor|weg|binnen|buiten|neer|terecht|thuis)(?=ge)/;

// MARK: Werkwoorden

const firstWord = (text) => String(text).split(' ')[0];
/** The stem a regular past is made from (werkte → werk) and whether it ends in a 't kofschip sound. */
function regularPast(past) {
  const word = firstWord(past);
  const match = word.match(/^(.+?)(te|de|ten|den)$/);
  if (!match) return null;
  const stem = match[1];
  const last = stem.endsWith('ch') ? 'ch' : stem.at(-1);
  const voiceless = match[2].startsWith('t');
  // leven → leefde, verhuizen → verhuisde: the stem ends in f/s, but the infinitive has v/z.
  const voiced = !voiceless && (last === 'f' || last === 's');
  return {stem, last, voiceless, voiced};
}

function pastEndingReason(verb, past) {
  const info = regularPast(past);
  if (!info) return null;
  const word = firstWord(past);
  if (info.voiced) return reason('’t kofschip', `ریشهٔ ${nl(info.stem)} در مصدر (${nl(verb)}) با ${nl(info.last === 'f' ? 'v' : 'z')} است، پس ${nl('-de')} می‌گیرد: ${nl(word)}.`);
  return info.voiceless
    ? reason('’t kofschip', `ریشهٔ ${nl(info.stem)} با ${nl(info.last)} تمام می‌شود که در ${KOFSCHIP} هست، پس ${nl('-te')} می‌گیرد: ${nl(word)}.`)
    : reason('’t kofschip', `ریشهٔ ${nl(info.stem)} با ${nl(info.last)} تمام می‌شود که در ${KOFSCHIP} نیست، پس ${nl('-de')} می‌گیرد: ${nl(word)}.`);
}

const auxName = (aux) => (aux === 'ben' ? 'zijn' : 'hebben');
function auxReason(verb, perfect) {
  const aux = firstWord(perfect);
  return aux === 'ben'
    ? reason('zijn', `${nl(verb)} در زمان کامل با ${nl('zijn')} می‌آید: ${nl(`ik ${perfect}`)}. فعل‌های حرکت به یک مقصد یا تغییر حالت (و ${nl('blijven')}) با zijn می‌آیند.`)
    : reason('hebben', `${nl(verb)} در زمان کامل با ${nl('hebben')} می‌آید: ${nl(`ik ${perfect}`)}. بیشتر فعل‌ها با hebben می‌آیند؛ zijn فقط برای حرکت به یک مقصد یا تغییر حالت است.`);
}

function participleReason(verb, perfect, regular) {
  const participle = perfect.split(' ').slice(1).join(' ');
  if (!regular) return reason('sterk werkwoord', `${nl(verb)} بی‌قاعده است؛ اسم مفعولش ${nl(participle)} را باید حفظ کنی.`);
  if (separable.test(participle)) return reason('scheidbaar', `${nl(verb)} جداشدنی است؛ ${nl('ge-')} وسط می‌آید، بعد از پیشوند: ${nl(participle)}.`);
  if (!participle.startsWith('ge') && inseparable.test(verb)) return reason('geen ge-', `فعل‌هایی که با ${nl('be-')}، ${nl('ver-')}، ${nl('ont-')}، ${nl('her-')}، ${nl('ge-')} یا ${nl('er-')} شروع می‌شوند ${nl('ge-')} نمی‌گیرند: ${nl(participle)}.`);
  const end = participle.at(-1);
  return reason('’t kofschip', `اسم مفعول باقاعده: ${nl('ge-')} + ریشه + ${nl(end)} (طبق ${KOFSCHIP}): ${nl(participle)}.`);
}

/**
 * Why an option of a Werkwoorden question is right or wrong.
 * `mistake` is the kind of wrong form the option was made from (see games.js).
 */
export function verbWhy({verb, past, perfect, note = ''}, kind, mistake) {
  const regular = /onregelmatig/.test(note) ? false : /regelmatig/.test(note) ? true : Boolean(regularPast(past));
  const participle = perfect.split(' ').slice(1).join(' ');
  if (!mistake) {
    if (kind === 'perfect') {
      const aux = auxReason(verb, perfect);
      const form = participleReason(verb, perfect, regular);
      return reason(form.tag === '’t kofschip' ? aux.tag : form.tag, `${aux.fa.split('. ')[0]}. ${form.fa}`);
    }
    return regular ? pastEndingReason(verb, past) ?? reason('regelmatig', `${nl(verb)} باقاعده است: ${nl(past)}.`)
      : reason('sterk werkwoord', `${nl(verb)} بی‌قاعده است؛ گذشته‌اش ${nl(past)} را باید حفظ کنی.`);
  }
  switch (mistake) {
    case 'aux': {
      const right = firstWord(perfect);
      const base = auxReason(verb, perfect);
      return reason('hebben of zijn', `${nl(verb)} با ${nl(auxName(right))} صرف می‌شود، نه ${nl(auxName(right === 'ben' ? 'heb' : 'ben'))}. ${base.fa.split('. ').slice(1).join('. ')}`);
    }
    case 'td': return kind === 'past' ? pastEndingReason(verb, past) : (() => {
      const info = regularPast(past);
      const end = participle.at(-1);
      if (!info) return reason('t of d', `اسم مفعول درست ${nl(participle)} است.`);
      return reason('’t kofschip', info.voiceless
        ? `ریشهٔ ${nl(info.stem)} با ${nl(info.last)} تمام می‌شود که در ${KOFSCHIP} هست، پس آخرش ${nl(end)} است: ${nl(participle)}.`
        : `ریشهٔ ${nl(info.stem)} با ${nl(info.last)} تمام می‌شود که در ${KOFSCHIP} نیست، پس آخرش ${nl(end)} است: ${nl(participle)}.`);
    })();
    case 'ge-added': return participleReason(verb, perfect, true).tag === 'scheidbaar'
      ? participleReason(verb, perfect, true)
      : reason('geen ge-', `فعل‌هایی که با ${nl('be-')}، ${nl('ver-')}، ${nl('ont-')}، ${nl('her-')}، ${nl('ge-')} یا ${nl('er-')} شروع می‌شوند ${nl('ge-')} نمی‌گیرند: ${nl(participle)}.`);
    case 'ge-dropped': return reason('ge-', `اسم مفعول معمولاً با ${nl('ge-')} شروع می‌شود: ${nl(participle)}.`);
    case 'past-for-participle': return reason('voltooid deelwoord', `${nl(firstWord(past))} گذشتهٔ ساده است. بعد از ${nl(firstWord(perfect))} اسم مفعول می‌آید: ${nl(perfect)}.`);
    case 'participle-for-past': return reason('verleden tijd', `${nl(participle)} اسم مفعول است و فقط با hebben یا zijn می‌آید. گذشتهٔ ساده: ${nl(past)}.`);
    case 'infinitive': return reason('verleden tijd', `${nl(verb)} مصدر است. گذشتهٔ ساده: ${nl(past)}.`);
    case 'regular': if (past.includes(' ')) return reason('scheidbaar', `${nl(verb)} جداشدنی است؛ در گذشتهٔ ساده پیشوند به آخر جمله می‌رود: ${nl(past)}.`);
      return regular
      ? reason('stam + te/de', `ریشه را از «${nl(`ik ${firstWord(past).replace(/(te|de)$/, '')}`)}» بگیر و ${nl('-te')} یا ${nl('-de')} اضافه کن: ${nl(past)}.`)
      : reason('sterk werkwoord', `${nl(verb)} بی‌قاعده است؛ گذشته‌اش با ${nl('-te')} یا ${nl('-de')} ساخته نمی‌شود: ${nl(past)}.`);
    default: return null;
  }
}

// MARK: De of het?

const articleRules = [
  {test: (noun) => /je$/.test(noun) && noun.length > 3, article: 'het', tag: '-je → altijd het', fa: (noun) => `کلمه‌هایی که با ${nl('-je')} تمام می‌شوند (کوچک‌شده) همیشه ${nl('het')} می‌گیرند: ${nl(`het ${noun}`)}.`},
  {test: (noun) => /(ing|heid|teit|tie|sie)$/.test(noun), article: 'de', tag: (noun) => `-${noun.match(/(ing|heid|teit|tie|sie)$/)[1]} → de`, fa: (noun) => `کلمه‌هایی که با ${nl(`-${noun.match(/(ing|heid|teit|tie|sie)$/)[1]}`)} تمام می‌شوند ${nl('de')} می‌گیرند: ${nl(`de ${noun}`)}.`},
  {test: (noun) => /(isme|ment|um)$/.test(noun), article: 'het', tag: (noun) => `-${noun.match(/(isme|ment|um)$/)[1]} → het`, fa: (noun) => `کلمه‌هایی که با ${nl(`-${noun.match(/(isme|ment|um)$/)[1]}`)} تمام می‌شوند معمولاً ${nl('het')} می‌گیرند: ${nl(`het ${noun}`)}.`},
];

/** Why a noun takes de or het. `verbs` (infinitives) let "het eten" be explained as a verb used as a noun. */
export function articleWhy(noun, article, verbs = new Set()) {
  if (article === 'het' && verbs.has(noun)) return reason('werkwoord → het', `${nl(noun)} اینجا فعلی است که اسم شده؛ این‌ها همیشه ${nl('het')} می‌گیرند: ${nl(`het ${noun}`)}.`);
  for (const rule of articleRules) {
    if (rule.test(noun) && rule.article === article) return reason(typeof rule.tag === 'function' ? rule.tag(noun) : rule.tag, rule.fa(noun));
  }
  return reason('uit je hoofd', `برای ${nl(noun)} قانون مشخصی نیست؛ این کلمه را همیشه با حرف تعریفش یاد بگیر: ${nl(`${article} ${noun}`)}.`);
}

// MARK: Woorden

/** A wrong word choice: what the chosen option means instead. `field` is the language of the options. */
export function meaningWhy(card, other, field) {
  if (!other?.nl || !other.meaning) return null;
  return field === 'meaning'
    ? reason('ander woord', `«${other.meaning}» معنی ${nl(other.nl)} است؛ ${nl(card.nl)} یعنی «${card.meaning}».`)
    : reason('ander woord', `${nl(other.nl)} یعنی «${other.meaning}»؛ «${card.meaning}» می‌شود ${nl(card.nl)}.`);
}

/** A word that does not fit a gap: what it means, when the word list knows it. */
export function gapWordWhy(label, answer, lookup) {
  const chosen = lookup(label);
  if (!chosen?.meaning) return null;
  const right = lookup(answer);
  return reason('ander woord', right?.meaning
    ? `${nl(label)} یعنی «${chosen.meaning}»؛ اینجا ${nl(answer)} لازم است، یعنی «${right.meaning}».`
    : `${nl(label)} یعنی «${chosen.meaning}» و اینجا جور درنمی‌آید؛ درستش ${nl(answer)} است.`);
}

// MARK: Gesprekken

export const dialogueWhy = (line) => (line?.translation ? reason('past niet', `این جمله یعنی «${line.translation}» و جواب این گفتگو نیست.`) : null);

// MARK: Grammatica en zinsbouw

/** The rule of a grammar pattern or an irregular set, which the content already has in Persian. */
export const ruleWhy = (card) => (card?.rule ? reason(card.title && !card.id?.startsWith('onr:') ? card.title : card.themeTitle ?? card.title ?? 'regel', card.rule) : null);

const subordinators = ['omdat', 'dat', 'als', 'wanneer', 'terwijl', 'toen', 'voordat', 'nadat', 'zodat', 'hoewel', 'totdat', 'zodra', 'of'];
const questionWords = ['wat', 'waar', 'wanneer', 'hoe', 'waarom', 'wie', 'welke', 'welk', 'hoeveel', 'hoelang', 'waarmee', 'waarover', 'waarheen', 'waarvoor'];
const subjects = ['ik', 'jij', 'je', 'u', 'hij', 'zij', 'ze', 'het', 'we', 'wij', 'jullie', 'men', 'er'];

/** Word order of a practical sentence: verb second, verb first in a yes/no question, verb last after omdat. */
export function orderWhy(sentence) {
  const clean = String(sentence).replace(/[.?!…]+$/, '');
  const tokens = clean.split(/\s+/);
  const words = tokens.map((word) => word.toLocaleLowerCase('nl').replace(/[,;:]/g, ''));
  const question = /\?\s*$/.test(sentence);
  // A subordinate clause only when a subject follows the conjunction: "omdat ik", not "als monteur".
  const sub = words.findIndex((word, index) => index > 0 && subordinators.includes(word) && subjects.includes(words[index + 1]) && words.length - index > 3);
  if (sub > 0) return reason('werkwoord achteraan', `بعد از ${nl(words[sub])} جملهٔ وابسته می‌آید و فعل صرف‌شده به آخر آن جمله می‌رود: ${nl(tokens.slice(sub).join(' '))}.`);
  if (question && (questionWords.includes(words[0]) || questionWords.includes(words[1]))) return reason('vraagwoord + werkwoord', `در سؤالی که با کلمهٔ پرسشی شروع می‌شود، فعل صرف‌شده بلافاصله بعد از بخش پرسشی می‌آید و فاعل بعد از فعل.`);
  if (question) return reason('ja/nee-vraag', `در سؤال بله/خیر، فعل صرف‌شده (${nl(tokens[0])}) اول جمله می‌آید و فاعل بعد از آن.`);
  if (words.length > 3 && !subjects.includes(words[0]) && subjects.includes(words[2])) return reason('werkwoord op plek 2', `فعل صرف‌شده جای دوم جمله است. وقتی جمله با ${nl(tokens[0])} شروع می‌شود، فاعل بعد از فعل می‌آید: ${nl(tokens.slice(0, 3).join(' '))}.`);
  if (subjects.includes(words[0])) return reason('werkwoord op plek 2', `فعل صرف‌شده جای دوم جمله است، بعد از فاعل: ${nl(tokens.slice(0, 2).join(' '))} …`);
  return null;
}

// MARK: Typen en dictee (also in Swift and Kotlin: keep the three the same)

const vowels = 'aeiou';
/** The first word that differs between what was typed and the answer, with the rule when we recognise it. */
export function spellingWhy(input, answer) {
  const given = normalizeAnswer(input).split(' ');
  const expected = normalizeAnswer(answer).split(' ');
  const articles = ['de', 'het', 'een'];
  if (articles.includes(expected[0]) && given[0] !== expected[0]) {
    if (!articles.includes(given[0])) return reason('lidwoord', `حرف تعریف را جا نینداز: ${nl(`${expected[0]} ${expected[1] ?? ''}`.trim())}.`);
    return reason('lidwoord', `${nl(expected[1] ?? '')} با ${nl(expected[0])} می‌آید، نه ${nl(given[0])}.`);
  }
  const index = expected.findIndex((word, at) => word !== given[at]);
  if (index < 0) return null;
  const right = expected[index];
  const wrong = given[index] ?? '';
  if (!wrong) return null;
  for (const vowel of vowels) {
    const double = vowel + vowel;
    if (wrong.replace(double, vowel) === right && wrong.includes(double)) return reason('open lettergreep', `در ${nl(right)} هجا با حرف صدادار تمام می‌شود، پس یک ${nl(vowel)} کافی است؛ ${nl(double)} فقط در هجای بسته می‌آید.`);
    if (right.replace(double, vowel) === wrong && right.includes(double)) return reason('gesloten lettergreep', `در ${nl(right)} هجا بسته است (بعدش صامت می‌آید)، پس صدای بلند را با ${nl(double)} می‌نویسی.`);
  }
  if (wrong.replace(/ei/g, 'ij') === right || wrong.replace(/ij/g, 'ei') === right) return reason('ei of ij', `${nl(right)} با ${nl(right.includes('ij') ? 'ij' : 'ei')} نوشته می‌شود. ei و ij یک صدا دارند؛ باید املای هر کلمه را حفظ کنی.`);
  if (wrong.replace(/au/g, 'ou') === right || wrong.replace(/ou/g, 'au') === right) return reason('au of ou', `${nl(right)} با ${nl(right.includes('ou') ? 'ou' : 'au')} نوشته می‌شود. au و ou یک صدا دارند.`);
  const doubled = right.match(/([bcdfgklmnprstvz])\1/);
  if (doubled && wrong === right.replace(doubled[0], doubled[1])) return reason('dubbele medeklinker', `بعد از صدای کوتاه، صامت دوبار نوشته می‌شود: ${nl(right)}.`);
  if (wrong.replace(/([bcdfgklmnprstvz])\1/, '$1') === right && wrong !== right) return reason('één medeklinker', `بعد از صدای بلند یک صامت کافی است: ${nl(right)}.`);
  if (wrong.slice(0, -1) === right.slice(0, -1) && /[dt]$/.test(right) && /[dt]$/.test(wrong)) return reason('d of t', `${nl(right)} با ${nl(right.at(-1))} نوشته می‌شود، هرچند آخر کلمه صدای t می‌دهد.`);
  return reason('spelling', `اینجا ${nl(right)} نوشته می‌شود، نه ${nl(wrong)}.`);
}

/** The letters of `typed` that differ from `answer`, for highlighting: [{text, wrong}]. */
export function spellingDiff(typed, answer) {
  const a = String(typed), b = String(answer);
  let start = 0;
  while (start < a.length && start < b.length && a[start].toLowerCase() === b[start].toLowerCase()) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end].toLowerCase() === b[b.length - 1 - end].toLowerCase()) end++;
  return [{text: a.slice(0, start), wrong: false}, {text: a.slice(start, a.length - end), wrong: true}, {text: a.slice(a.length - end), wrong: false}].filter((part) => part.text);
}

// MARK: Onregelmatig

/**
 * Why an option of an irregular verb form is right or wrong. `facts.perfect` uses heeft/is (hij-form);
 * `regular` holds the forms a learner makes when treating the verb as regular (see irregular.js).
 */
export function irregularVerbWhy({verb, past, pastPlural, perfect, regular}, ask, label, correct) {
  const [aux, ...rest] = perfect.split(' ');
  const participle = rest.join(' ');
  const zijn = aux === 'is' || aux === 'zijn';
  const remember = ask === 1
    ? reason('sterk werkwoord', `${nl(verb)} بی‌قاعده است؛ گذشته‌اش ${nl(past)} (جمع: ${nl(pastPlural)}) را باید حفظ کنی.`)
    : reason(zijn ? 'zijn' : 'sterk werkwoord', `${nl(verb)} بی‌قاعده است و با ${nl(zijn ? 'zijn' : 'hebben')} می‌آید: ${nl(`hij ${perfect}`)}.`);
  if (correct) return remember;
  const same = (a, b) => normalizeAnswer(a) === normalizeAnswer(b);
  if (ask === 1) {
    if (same(label, regular.past)) return reason('sterk werkwoord', `${nl(verb)} بی‌قاعده است؛ گذشته‌اش با ${nl('-te')} یا ${nl('-de')} ساخته نمی‌شود: ${nl(past)}.`);
    if (same(label, pastPlural)) return reason('enkelvoud', `${nl(label)} شکل جمع است (${ltr('wij, jullie, zij')}). برای ${ltr('ik, jij, hij')}: ${nl(past)}.`);
    if (same(label, regular.present)) return reason('verleden tijd', `${nl(label)} زمان حال است. گذشتهٔ ساده: ${nl(past)}.`);
    if (same(label, participle)) return reason('verleden tijd', `${nl(label)} اسم مفعول است و فقط با hebben یا zijn می‌آید. گذشتهٔ ساده: ${nl(past)}.`);
    return remember;
  }
  const [labelAux, ...labelRest] = String(label).split(' ');
  const labelForm = labelRest.join(' ');
  if (same(labelForm, participle) && labelAux !== aux) return reason('hebben of zijn', `${nl(verb)} با ${nl(zijn ? 'zijn' : 'hebben')} صرف می‌شود، نه ${nl(zijn ? 'hebben' : 'zijn')}: ${nl(`hij ${perfect}`)}.`);
  if (same(labelForm, regular.participle)) return reason('sterk werkwoord', `${nl(verb)} بی‌قاعده است؛ اسم مفعولش ${nl(participle)} است، نه ${nl(regular.participle)}.`);
  if (same(labelForm, past)) return reason('voltooid deelwoord', `${nl(past)} گذشتهٔ ساده است. بعد از ${nl(aux)} اسم مفعول می‌آید: ${nl(perfect)}.`);
  return remember;
}

/** Plurals, comparisons and present-tense forms: the set's own rule. */
export const setWhy = (title, fa) => (fa ? reason(title, fa) : null);
