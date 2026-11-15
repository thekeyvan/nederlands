// sitemap.xml, robots.txt, llms.txt and llms-full.txt: everything comes from the same lesson content as the pages.
import {patterns, themes, totals} from './content.server';
import {EMAIL, LANGS, SITE, at, patternPath, themePath} from './lang';

const today = () => new Date().toISOString().slice(0, 10);

/** Language-neutral paths of every public page, with their sitemap priority. */
export const pages = (): {path: string; priority: string}[] => [
  {path: '/', priority: '1.0'},
  {path: '/woorden/', priority: '0.9'},
  ...themes.map((theme) => ({path: themePath(theme.id), priority: '0.8'})),
  {path: '/grammatica/', priority: '0.9'},
  ...patterns.map((p) => ({path: patternPath(p.slug), priority: '0.7'})),
  {path: '/inburgering/', priority: '0.8'},
];

export function sitemap() {
  const date = today();
  const entry = (lang: (typeof LANGS)[number], item: {path: string; priority: string}) =>
    `  <url><loc>${SITE}${at(lang, item.path)}</loc><lastmod>${date}</lastmod><priority>${item.priority}</priority>${LANGS.map((alt) => `<xhtml:link rel="alternate" hreflang="${alt}" href="${SITE}${at(alt, item.path)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${at('nl', item.path)}"/></url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGS.flatMap((lang) => pages().map((item) => entry(lang, item))).join('\n')}
  <url><loc>${SITE}/privacy</loc><lastmod>${date}</lastmod><priority>0.2</priority></url>
</urlset>
`;
}

export function robots() {
  // Search engines and AI assistants are welcome: the pages exist to be found and quoted.
  const bots = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'CCBot', 'meta-externalagent', 'DuckDuckBot', 'YandexBot'];
  return `# Nedfa (nedfa.nl): free Dutch lessons for Persian speakers. Crawlers and AI assistants are welcome.
${bots.map((bot) => `User-agent: ${bot}\nAllow: /\n`).join('\n')}
User-agent: *
Allow: /
Disallow: /deployment-config.json

Sitemap: ${SITE}/sitemap.xml
`;
}

export function llms() {
  return `# Nedfa (نِدفا)

> Nedfa is a free app and website for learning Dutch (Nederlands) for Persian (Farsi/Dari) speakers, from level A2 to B1. It teaches ${totals.words} Dutch words and expressions in ${totals.themes} everyday themes, ${totals.phrases} practical sentences, ${totals.dialogues} short dialogues and ${totals.patterns} grammar patterns, all with Persian translations and Dutch audio, plus spaced repetition (SM-2) and seven study games. It also helps people prepare for the Dutch civic integration exam (inburgeringsexamen). The public pages exist in Dutch (${SITE}/, the default) and Persian (${SITE}/fa/). Web app: ${SITE}/leren (no account needed). iPhone app: coming to the App Store. Contact: ${EMAIL}.

نِدفا اپ و سایت رایگان آموزش زبان هلندی برای فارسی‌زبانان (ایرانی‌ها و افغان‌ها) از سطح A2 تا B1 است.

Nedfa is een gratis app om Nederlands te leren voor Perzisch sprekenden, van A2 naar B1.

## Main pages
- [Home (Dutch)](${SITE}/) · [Persian: آموزش زبان هلندی به فارسی](${SITE}/fa/)
- [Dutch vocabulary by theme](${SITE}/woorden/) · [Persian: لغات هلندی به فارسی](${SITE}/fa/woorden/): ${totals.themes} themes with Dutch word, de/het, Persian meaning and example sentence
- [Dutch grammar](${SITE}/grammatica/) · [Persian: گرامر زبان هلندی](${SITE}/fa/grammatica/): ${totals.patterns} patterns with Persian explanation and examples
- [Inburgering exam guide](${SITE}/inburgering/) · [Persian: آزمون اینبورخرینگ](${SITE}/fa/inburgering/): exam parts, A2/B1 level and a daily practice plan
- [The app (practice)](${SITE}/leren)
- [Full text of all lessons](${SITE}/llms-full.txt)
- [Content API (JSON)](${SITE}/api/v1): themes, words, phrases, dialogues and grammar with Persian translations

## Vocabulary themes
${themes.map((theme) => `- [${theme.title} (${theme.fa})](${SITE}${themePath(theme.id)}): ${theme.words.length} words, ${theme.phrases.length} phrases`).join('\n')}

## Grammar patterns
${patterns.map((p) => `- [${p.title} (${p.level})](${SITE}${patternPath(p.slug)})`).join('\n')}

## Optional
- [Privacy](${SITE}/privacy)
`;
}

export function llmsFull() {
  const themeText = themes.map((theme) => `## ${theme.title} — ${theme.fa}
Source: ${SITE}${themePath(theme.id)}

### Words (Dutch — Persian — example)
${theme.words.map((word) => `- ${word.nl} — ${word.meaning ?? ''} — ${word.example ?? ''} (${word.translation ?? ''})`).join('\n')}

### Phrases
${theme.phrases.map((phrase) => `- ${phrase.nl} — ${phrase.meaning ?? ''}`).join('\n')}

### Dialogue
${theme.dialogue.map((line) => `- ${line.speaker}: ${line.nl} — ${line.translation}`).join('\n')}
`).join('\n');
  const grammarText = patterns.map((p) => `## ${p.title} (${p.level})
Source: ${SITE}${patternPath(p.slug)}
Pattern: ${p.pattern}
Rule (Persian): ${p.rule}
${p.note ? `Note (Persian): ${p.note}\n` : ''}Examples:
${p.examples.map((example) => `- ${example.nl} — ${example.translation}`).join('\n')}
`).join('\n');
  return `# Nedfa — all lessons (Dutch for Persian speakers, A2–B1)

Free to read and quote with a link to ${SITE}. Practise with audio and spaced repetition at ${SITE}/leren.

# Vocabulary
${themeText}
# Grammar
${grammarText}`;
}

/** A plain-text response that browsers and caches may keep for an hour. */
export const text = (body: string, type: string) => new Response(body, {headers: {'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'public, max-age=3600'}});
