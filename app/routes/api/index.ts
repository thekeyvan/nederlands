import {json, nativeContent, totals} from '../../api/content.server';
import {SITE} from '../../site/lang';

export function loader() {
  return json({
    name: 'Nedfa content API',
    description: 'Dutch lessons for Persian speakers (A2–B1): themes, words, phrases, dialogues and grammar with Persian translations. Free to use with a link to https://nedfa.nl.',
    version: nativeContent().version,
    totals,
    endpoints: {
      version: `${SITE}/api/v1/version`,
      content: `${SITE}/api/v1/content`,
      themes: `${SITE}/api/v1/themes`,
      theme: `${SITE}/api/v1/themes/{id}`,
      patterns: `${SITE}/api/v1/patterns`,
      pattern: `${SITE}/api/v1/patterns/{slug}`,
      search: `${SITE}/api/v1/search?q={text}`,
    },
  });
}
