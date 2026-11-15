import {type RouteConfig, index, layout, route} from '@react-router/dev/routes';

/** The public pages exist in Dutch (at the root) and Persian (under /fa/); one module serves both. */
const sitePages = (lang: 'nl' | 'fa') => {
  const path = (rest: string) => (lang === 'nl' ? rest : `fa/${rest}`);
  const id = (name: string) => `${name}-${lang}`;
  return [
    lang === 'nl' ? index('routes/site/home.tsx', {id: id('home')}) : route('fa', 'routes/site/home.tsx', {id: id('home')}),
    route(path('woorden'), 'routes/site/themes.tsx', {id: id('themes')}),
    route(path('woorden/:theme'), 'routes/site/theme.tsx', {id: id('theme')}),
    route(path('grammatica'), 'routes/site/grammar.tsx', {id: id('grammar')}),
    route(path('grammatica/:slug'), 'routes/site/pattern.tsx', {id: id('pattern')}),
    route(path('inburgering'), 'routes/site/inburgering.tsx', {id: id('inburgering')}),
  ];
};

export default [
  layout('routes/site/layout.tsx', [...sitePages('nl'), ...sitePages('fa'), route('privacy', 'routes/site/privacy.tsx')]),
  // The practice app (noindex). Its own screens use the hash, so old links keep working.
  route('leren', 'routes/leren.tsx'),
    // Crawlers, AI assistants and the apps.
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  route('llms.txt', 'routes/llms.ts'),
  route('llms-full.txt', 'routes/llms-full.ts'),
  route('deployment-config.json', 'routes/deployment-config.ts'),
  // Content API for the iPhone app and anyone who wants the lessons as JSON.
  route('api/v1', 'routes/api/index.ts'),
  route('api/v1/version', 'routes/api/version.ts'),
  route('api/v1/content', 'routes/api/content.ts'),
  route('api/v1/themes', 'routes/api/themes.ts'),
  route('api/v1/themes/:id', 'routes/api/theme.ts'),
  route('api/v1/patterns', 'routes/api/patterns.ts'),
  route('api/v1/patterns/:id', 'routes/api/pattern.ts'),
  route('api/v1/search', 'routes/api/search.ts'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
