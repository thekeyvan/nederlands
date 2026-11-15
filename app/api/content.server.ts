// The content API: the same lessons as the website and the iPhone app, as JSON. Built once per server start.
import {createHash} from 'node:crypto';
import {buildNativeContent} from '../../src/core/native-content.js';
import {patterns, themes, totals} from '../site/content.server';
import {SITE, patternPath, themeImage, themePath} from '../site/lang';

let cache: {body: string; version: string} | null = null;
/** The full content in the shape the iPhone app reads, with a version that changes when the content does. */
export function nativeContent() {
  if (!cache) {
    const content = buildNativeContent();
    const version = createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
    cache = {version, body: JSON.stringify({version, ...content})};
  }
  return cache;
}

const headers = (extra: Record<string, string> = {}) => ({
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
  'X-Robots-Tag': 'noindex',
  ...extra,
});
export const json = (data: unknown, init: {status?: number; headers?: Record<string, string>} = {}) => Response.json(data, {status: init.status ?? 200, headers: headers(init.headers)});
export const missing = (what: string) => json({error: `${what} niet gevonden`}, {status: 404});

/** Answers 304 when the client already has this version. */
export function versioned(request: Request, version: string, body: () => string) {
  const etag = `"${version}"`;
  if (request.headers.get('If-None-Match') === etag) return new Response(null, {status: 304, headers: headers({ETag: etag})});
  return new Response(body(), {headers: headers({'Content-Type': 'application/json; charset=utf-8', ETag: etag})});
}

export const themeSummary = (theme: (typeof themes)[number]) => ({
  id: theme.id, title: theme.title, fa: theme.fa, group: theme.group,
  words: theme.words.length, phrases: theme.phrases.length,
  image: SITE + themeImage(theme.id), url: SITE + themePath(theme.id),
});

export const themeDetail = (theme: (typeof themes)[number]) => ({
  ...themeSummary(theme),
  intro: theme.intro ?? null,
  words: theme.words.map(({id, nl, kind, forms, meaning, example, translation}) => ({id, nl, kind: kind ?? 'woord', forms: forms ?? null, fa: meaning ?? null, example: example ?? null, exampleFa: translation ?? null})),
  phrases: theme.phrases.map(({id, nl, meaning}) => ({id, nl, fa: meaning ?? null})),
  dialogue: theme.dialogue.map(({id, speaker, nl, translation}) => ({id, speaker, nl, fa: translation})),
});

export const patternSummary = (p: (typeof patterns)[number]) => ({id: p.id, slug: p.slug, title: p.title, level: p.level, pattern: p.pattern, url: SITE + patternPath(p.slug)});
export const patternDetail = (p: (typeof patterns)[number]) => ({...patternSummary(p), ruleFa: p.rule, noteFa: p.note || null, examples: p.examples.map(({nl, gap, translation}) => ({nl, gap: gap ?? null, fa: translation}))});

export {patterns, themes, totals};
