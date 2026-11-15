// Anonymous visitor statistics (Umami on our own server, see server/stats.mjs and docs/ANALYTICS.md).
// No cookies, no account ids, nothing the learner typed: only which page or screen was opened and a few named moments.
// Off outside nedfa.nl, with Do Not Track or Global Privacy Control, and when the learner turns it off in Instellingen.
const WEBSITE = '0cbc91c6-7ae2-4c9a-9851-d005214361fa';
const OFF_KEY = 'nedfa-stats-off';

type Data = Record<string, string | number | boolean>;
let cache: string | undefined;
let firstView = true;
let disabledNow = false;
let lastUrl = '';

export function statsEnabled() {
  try {
    return localStorage.getItem(OFF_KEY) !== '1';
  } catch {
    return true;
  }
}
export function setStatsEnabled(on: boolean) {
  try {
    if (on) localStorage.removeItem(OFF_KEY);
    else localStorage.setItem(OFF_KEY, '1');
  } catch {
    /* Without storage the choice lasts until the page closes. */
  }
  disabledNow = !on;
}

function allowed() {
  if (typeof window === 'undefined' || disabledNow || !statsEnabled()) return false;
  if (location.hostname !== 'nedfa.nl') return false;
  const nav = navigator as Navigator & {globalPrivacyControl?: boolean};
  return nav.doNotTrack !== '1' && !nav.globalPrivacyControl;
}

function send(payload: {url: string} & Record<string, unknown>) {
  if (!allowed()) return;
  const body = JSON.stringify({type: 'event', payload: {
    website: WEBSITE, hostname: location.hostname, language: navigator.language,
    screen: `${screen.width}x${screen.height}`, title: document.title, referrer: '', ...payload,
  }});
  void fetch('/stats/api/send', {method: 'POST', keepalive: true, credentials: 'omit', body,
    headers: {'Content-Type': 'application/json', ...(cache ? {'x-umami-cache': cache} : {})}})
    .then((response) => (response.ok ? response.json() : null))
    .then((reply) => { if (reply?.cache) cache = reply.cache; })
    .catch(() => {});
}

/** A page or app screen. `url` is a path such as /woorden/huisarts/ or /leren/oefenen. */
export function trackView(url: string) {
  if (url === lastUrl) return;
  lastUrl = url;
  // Only the first view carries where the visitor came from (another site, not our own pages).
  const referrer = firstView && document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : '';
  firstView = false;
  send({url, referrer});
}

/** A named moment, such as a finished round. Never pass anything the learner typed. */
export function trackEvent(name: string, data?: Data) {
  send({url: lastUrl || location.pathname, name, ...(data ? {data} : {})});
}
