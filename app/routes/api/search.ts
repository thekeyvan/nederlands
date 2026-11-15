import type {Route} from './+types/search';
import {json, themes} from '../../api/content.server';
import {SITE, themePath} from '../../site/lang';

const fold = (text = '') => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

/** Words and phrases whose Dutch or Persian contains the text (at most 25). */
export function loader({request}: Route.LoaderArgs) {
  const q = fold(new URL(request.url).searchParams.get('q')?.trim().slice(0, 60));
  if (q.length < 2) return json({error: 'Geef minstens twee letters: ?q=…', results: []}, {status: 400});
  const results = themes.flatMap((theme) => [
    ...theme.words.map((word) => ({type: 'word', id: word.id, nl: word.nl, fa: word.meaning ?? null, theme: theme.id, url: SITE + themePath(theme.id)})),
    ...theme.phrases.map((phrase) => ({type: 'phrase', id: phrase.id, nl: phrase.nl, fa: phrase.meaning ?? null, theme: theme.id, url: SITE + themePath(theme.id)})),
  ]).filter((item) => fold(item.nl).includes(q) || fold(item.fa ?? '').includes(q));
  return json({query: q, count: results.length, results: results.slice(0, 25)});
}
