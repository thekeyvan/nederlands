/// <reference lib="webworker" />
// Service worker: the app shell and illustrations are precached, so the app opens offline.
// Audio clips are cached the first time they play (or all at once from Ik → Offline luisteren).
import {cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute} from 'workbox-precaching';
import {NavigationRoute, registerRoute} from 'workbox-routing';
import {CacheFirst, NetworkFirst} from 'workbox-strategies';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {ExpirationPlugin} from 'workbox-expiration';
import {RangeRequestsPlugin} from 'workbox-range-requests';
import {clientsClaim} from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
// Control open pages as soon as the first version installs; later versions still wait for “Vernieuwen”.
clientsClaim();

// App pages (/, /leren.html, links with ?thema= or the OAuth ?code=) all use the cached app shell.
// The privacy page and the old resources redirect are separate documents.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html'), {denylist: [/\/privacy\.html$/, /\/bronnen\.html$/, /\/assets\//]}));

// Audio players ask for byte ranges, which cannot be cached directly. Fetch the whole clip
// once, keep it, and answer later range requests from the cache.
const AUDIO_CACHE = 'nederlands-audio';
registerRoute(
  ({url, sameOrigin}) => sameOrigin && url.pathname.includes('/assets/audio/') && url.pathname.endsWith('.mp3'),
  new CacheFirst({
    cacheName: AUDIO_CACHE,
    // A clip is the same for every page; hosts may add Vary headers that would make lookups miss.
    matchOptions: {ignoreVary: true},
    plugins: [
      {requestWillFetch: async ({request}) => new Request(request.url, {credentials: 'same-origin'})},
      new CacheableResponsePlugin({statuses: [200]}),
      new RangeRequestsPlugin(),
      new ExpirationPlugin({maxEntries: 6000, purgeOnQuotaError: true}),
    ],
  }),
);

// Account settings: fresh when online, the last saved copy when offline.
registerRoute(
  ({url, sameOrigin}) => sameOrigin && url.pathname.endsWith('/deployment-config.json'),
  new NetworkFirst({cacheName: 'nederlands-config', networkTimeoutSeconds: 4, plugins: [new CacheableResponsePlugin({statuses: [200]})]}),
);

// The page asks before activating a new version, so a practice round is never interrupted.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting();
});
