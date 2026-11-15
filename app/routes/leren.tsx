import {StrictMode, Suspense, lazy, useEffect, useState} from 'react';
import type {Route} from './+types/leren';
import {SITE} from '../site/lang';

// The practice app keeps progress on the device (and in the account), so it renders in the browser.
// The server sends this light shell first; the app code loads right after.
const App = lazy(async () => {
  const [{App: Screen}, theme, native] = await Promise.all([import('@/App'), import('@/hooks/use-theme'), import('@/lib/native'), import('@/lib/pwa')]);
  theme.applyInitialTheme();
  void native.startNative();
  return {default: Screen};
});

export const meta: Route.MetaFunction = () => [
  {title: 'Nedfa — oefenen'},
  {name: 'description', content: 'Elke dag een beetje Nederlands, als een spel. Ontdek thema’s, luister naar voorbeelden en oefen met reeksen, sterren en stempels.'},
  {name: 'robots', content: 'noindex, follow'},
  {tagName: 'link', rel: 'canonical', href: `${SITE}/leren`},
  {name: 'theme-color', content: '#fcfaf6'},
  {name: 'mobile-web-app-capable', content: 'yes'},
  {name: 'apple-mobile-web-app-capable', content: 'yes'},
  {name: 'apple-mobile-web-app-title', content: 'Nedfa'},
  {name: 'apple-mobile-web-app-status-bar-style', content: 'default'},
];

export const links: Route.LinksFunction = () => [{rel: 'manifest', href: '/manifest.webmanifest'}];

function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4" role="status">
      <img src="/img/logo.png" alt="" width={88} height={88} className="size-22 animate-pulse rounded-3xl" />
      <p className="text-sm font-medium text-muted-foreground">Even laden…</p>
      <noscript><p className="max-w-xs px-6 text-center text-sm">Zet JavaScript aan om te oefenen. De <a className="underline" href="/privacy">privacyinformatie</a> kun je ook zonder bekijken.</p></noscript>
    </div>
  );
}

export default function Leren() {
  const [browser, setBrowser] = useState(false);
  useEffect(() => setBrowser(true), []);
  if (!browser) return <Loading />;
  return (
    <StrictMode>
      <Suspense fallback={<Loading />}><App /></Suspense>
    </StrictMode>
  );
}
