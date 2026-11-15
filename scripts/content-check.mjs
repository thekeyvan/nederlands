// Checks every lesson file: run `npm run content:check` after adding or changing content.
// Errors (exit 1) break the apps; warnings are things to finish later (a picture, audio clips).
import {existsSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {grammarFiles, groups, themeFiles} from '../content/index.js';
import {lineId, phraseId, slug, wordId} from '../content/ids.js';
import {audioCatalog} from '../src/core/audio-catalog.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const KINDS = ['woord', 'werkwoord', 'uitdrukking'];
const LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2'];
const THEME_LEVELS = ['A0', 'A1', 'A2', 'B1'];
const persian = /[؀-ۿ]/;

/** Returns {errors, warnings}, each a list of "file › place: problem" lines. */
export function checkContent() {
  const errors = [];
  const warnings = [];
  const ids = new Map();
  const claim = (id, where) => {
    if (ids.has(id)) errors.push(`${where}: id "${id}" is also used in ${ids.get(id)}`);
    else ids.set(id, where);
  };
  const text = (value, where, field, {fa = false} = {}) => {
    if (typeof value !== 'string' || !value.trim()) errors.push(`${where}: "${field}" is empty`);
    else if (fa && !persian.test(value)) errors.push(`${where}: "${field}" should be Persian: "${value}"`);
    else if (!fa && persian.test(value)) errors.push(`${where}: "${field}" should be Dutch, it has Persian letters: "${value}"`);
  };

  // Every file on disk is listed, every listed theme is in one group.
  const listed = (dir, files) => {
    const onDisk = readdirSync(path.join(ROOT, 'content', dir)).filter((file) => file.endsWith('.json'));
    const ids = new Set(files.map((file) => file.id));
    for (const file of onDisk) {
      const id = dir === 'themes' ? file.replace(/\.json$/, '') : `zin:${file.replace(/\.json$/, '')}`;
      if (!ids.has(id)) errors.push(`content/${dir}/${file}: not imported in content/index.js (add an import line and put it in the list)`);
    }
  };
  listed('themes', themeFiles);
  listed('grammar', grammarFiles);
  const grouped = groups.flatMap((group) => group.themes);
  for (const theme of themeFiles) {
    const count = grouped.filter((id) => id === theme.id).length;
    if (count !== 1) errors.push(`content/index.js: theme "${theme.id}" must be in exactly one group (now ${count})`);
  }
  for (const id of grouped) if (!themeFiles.some((theme) => theme.id === id)) errors.push(`content/index.js: group lists unknown theme "${id}"`);

  for (const theme of themeFiles) {
    const file = `content/themes/${theme.id}.json`;
    if (!/^[a-z0-9-]+$/.test(theme.id)) errors.push(`${file}: id "${theme.id}" may only have a–z, 0–9 and -`);
    text(theme.title, file, 'title');
    text(theme.fa, file, 'fa', {fa: true});
    text(theme.intro, file, 'intro');
    if (theme.level !== undefined && !THEME_LEVELS.includes(theme.level)) errors.push(`${file}: "level" must be one of ${THEME_LEVELS.join(', ')} (or left out for A2)`);
    if (!existsSync(path.join(ROOT, 'src/assets/illustrations/themes', `${theme.id}.jpg`))) warnings.push(`${file}: no picture yet at src/assets/illustrations/themes/${theme.id}.jpg (the apps show the logo)`);
    if (theme.words.length < 8) warnings.push(`${file}: only ${theme.words.length} words; a theme feels complete from about 20`);
    const seen = new Set();
    theme.words.forEach((word, index) => {
      const where = `${file} › words[${index}] (${word.nl ?? '?'})`;
      text(word.nl, where, 'nl');
      text(word.fa, where, 'fa', {fa: true});
      text(word.example, where, 'example');
      text(word.exampleFa, where, 'exampleFa', {fa: true});
      if (!KINDS.includes(word.kind)) errors.push(`${where}: "kind" must be one of ${KINDS.join(', ')}`);
      if (word.forms !== undefined && (!Array.isArray(word.forms) || word.forms.length !== 3 || word.forms.some((form) => typeof form !== 'string' || !form))) errors.push(`${where}: "forms" must be [past, perfect, regelmatig|onregelmatig]`);
      if (word.kind === 'werkwoord' && !word.forms) warnings.push(`${where}: a verb without "forms" is left out of the Werkwoorden game`);
      if (word.nl && seen.has(slug(word.nl))) errors.push(`${where}: "${word.nl}" is twice in this theme`);
      seen.add(slug(word.nl ?? ''));
      claim(wordId(theme, word), where);
    });
    theme.phrases.forEach((phrase, index) => {
      const where = `${file} › phrases[${index}]`;
      text(phrase.nl, where, 'nl');
      text(phrase.fa, where, 'fa', {fa: true});
      if (!LEVELS.includes(phrase.level)) errors.push(`${where}: "level" must be one of ${LEVELS.join(', ')}`);
      claim(phraseId(theme, phrase, index), where);
    });
    theme.dialogue.forEach((line, index) => {
      const where = `${file} › dialogue[${index}]`;
      text(line.speaker, where, 'speaker');
      text(line.nl, where, 'nl');
      text(line.fa, where, 'fa', {fa: true});
      claim(lineId(theme, line, index), where);
    });
    if (theme.dialogue.length && !theme.dialogue.some((line) => line.speaker === 'Jij')) warnings.push(`${file} › dialogue: one speaker should be "Jij" (the learner) for the Gesprekken game`);
  }

  for (const rule of grammarFiles) {
    const file = `content/grammar/${rule.id.replace(/^zin:/, '')}.json`;
    if (!/^zin:[a-z0-9-]+$/.test(rule.id)) errors.push(`${file}: id must look like "zin:${rule.id.replace(/^zin:/, '')}" and match the file name`);
    for (const field of ['title', 'pattern', 'example', 'prompt', 'answer']) text(rule[field], file, field);
    if (!LEVELS.includes(rule.level)) errors.push(`${file}: "level" must be one of ${LEVELS.join(', ')}`);
    if (rule.prompt && (rule.prompt.match(/___/g) ?? []).length !== 1) errors.push(`${file}: "prompt" needs exactly one ___ where "answer" goes`);
    text(rule.fa?.rule, file, 'fa.rule', {fa: true});
    text(rule.fa?.translation, file, 'fa.translation', {fa: true});
    if (rule.examples.length < 3) warnings.push(`${file}: ${rule.examples.length} examples; 3 or more make a full round`);
    rule.examples.forEach((example, index) => {
      const where = `${file} › examples[${index}]`;
      text(example.nl, where, 'nl');
      text(example.gap, where, 'gap');
      text(example.fa, where, 'fa', {fa: true});
      const escaped = (example.gap ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hits = (example.nl ?? '').match(new RegExp(`(^|[^\\p{L}])${escaped}(?=[^\\p{L}]|$)`, 'gu'))?.length ?? 0;
      if (hits !== 1) errors.push(`${where}: "gap" ("${example.gap}") must appear exactly once in "nl" as a whole word (now ${hits})`);
    });
    claim(rule.id, file);
  }

  // Audio: every Dutch text needs a clip; new content gets them with scripts/generate-audio.py (docs/AUDIO.md).
  const texts = new Set();
  for (const theme of themeFiles) {
    for (const word of theme.words) { texts.add(word.nl); texts.add(word.example); }
    for (const phrase of theme.phrases) texts.add(phrase.nl);
    for (const line of theme.dialogue) texts.add(line.nl);
  }
  for (const rule of grammarFiles) { texts.add(rule.example); for (const example of rule.examples) texts.add(example.nl); }
  const missing = [...texts].filter((value) => value && !Object.hasOwn(audioCatalog.clips, value));
  if (missing.length) warnings.push(`audio: ${missing.length} Dutch texts have no clip yet, e.g. "${missing[0]}" (see docs/AUDIO.md)`);

  return {errors, warnings};
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const {errors, warnings} = checkContent();
  for (const line of warnings) console.warn(`warning  ${line}`);
  for (const line of errors) console.error(`error    ${line}`);
  const words = themeFiles.reduce((sum, theme) => sum + theme.words.length, 0);
  console.log(`\n${themeFiles.length} themes, ${words} words, ${grammarFiles.length} grammar rules: ${errors.length} errors, ${warnings.length} warnings.`);
  process.exit(errors.length ? 1 : 0);
}
