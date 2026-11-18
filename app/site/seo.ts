import type {MetaDescriptor} from 'react-router';
import {APP_NAME, APP_STORE_ID, SITE, at, type Lang} from './lang';

interface Seo {
  lang: Lang;
  /** Language-neutral path, e.g. "/" or "/woorden/werk/". */
  path: string;
  title: string;
  description: string;
  image?: string;
  jsonLd?: object[];
  /** [name, language-neutral path] pairs, home first. */
  breadcrumbs?: [string, string][];
}

/** Title, description, canonical and hreflang links, Open Graph, Twitter and schema.org for one public page. */
export function seo({lang, path, title, description, image = '/img/og.jpg', jsonLd = [], breadcrumbs}: Seo): MetaDescriptor[] {
  const url = SITE + at(lang, path);
  const crumbs = breadcrumbs
    ? [{'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map(([name, href], index) => ({'@type': 'ListItem', position: index + 1, name, item: SITE + at(lang, href)}))}]
    : [];
  return [
    {title},
    {name: 'description', content: description},
    {tagName: 'link', rel: 'canonical', href: url},
    {tagName: 'link', rel: 'alternate', hrefLang: 'fa', href: SITE + at('fa', path)},
    {tagName: 'link', rel: 'alternate', hrefLang: 'nl', href: SITE + at('nl', path)},
    {tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: SITE + at('nl', path)},
    {name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1'},
    {name: 'theme-color', content: '#fcfaf6', media: '(prefers-color-scheme: light)'},
    {name: 'theme-color', content: '#111a28', media: '(prefers-color-scheme: dark)'},
    {property: 'og:type', content: 'website'},
    {property: 'og:site_name', content: 'Nedfa'},
    {property: 'og:locale', content: lang === 'fa' ? 'fa_IR' : 'nl_NL'},
    {property: 'og:locale:alternate', content: lang === 'fa' ? 'nl_NL' : 'fa_IR'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: description},
    {property: 'og:url', content: url},
    {property: 'og:image', content: SITE + image},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: title},
    {name: 'twitter:description', content: description},
    {name: 'twitter:image', content: SITE + image},
    {name: 'apple-itunes-app', content: `app-id=${APP_STORE_ID}`},
    // The iPhone app for link previews (App Links, read by Facebook, WhatsApp and others) and X.
    {property: 'al:ios:app_store_id', content: APP_STORE_ID},
    {property: 'al:ios:app_name', content: APP_NAME},
    {property: 'al:web:url', content: url},
    {name: 'twitter:app:id:iphone', content: APP_STORE_ID},
    {name: 'twitter:app:name:iphone', content: APP_NAME},
    {tagName: 'link', rel: 'alternate', type: 'text/plain', title: 'llms.txt', href: '/llms.txt'},
    ...[...jsonLd, ...crumbs].map((data) => ({'script:ld+json': data})),
  ];
}

/** FAQ answers may hold a little trusted markup (links, Dutch words); schema.org gets the plain text. */
export const faqSchema = (items: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: a.replace(/<[^>]+>/g, '')}})),
});
