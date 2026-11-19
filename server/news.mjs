// Het nieuws van vandaag: the newest video of each news channel, from YouTube's public RSS feed.
// GET /api/v1/news gives {shows: {id: {url, title, published}}} for the apps; GET /nieuws/:id redirects (website).
// The video opens with the channel's uploads as a playlist behind it, so YouTube plays on to the next one.
// Shorts are skipped. When YouTube can't be reached, the channel page is used, as before.
// The NOS channel on YouTube has only Shorts now, so NOS opens the whole 20.00 uur journaal on NPO Start (newest first).

export const channels = {
  makkelijk: {channel: 'UCch2JvY2ZSwcjf5gb93HGQw', page: 'https://www.youtube.com/c/NOSNieuwsvandeWeek/videos'},
  jeugd: {channel: 'UC-bbHiTZGWKbsCjpzUfrk6Q', page: 'https://www.youtube.com/@jeugdjournaal/videos'},
  nos: {channel: null, page: 'https://npo.nl/start/serie/nos-journaal-20-00-uur/afleveringen'},
};

const entities = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"};
const decode = (text) => text.replace(/&(amp|lt|gt|quot|apos|#\d+);/g, (_, name) => (name.startsWith('#') ? String.fromCodePoint(Number(name.slice(1))) : entities[name]));

/** The newest regular video (no Short) in a channel's RSS feed, or null. */
export function latestFromFeed(xml) {
  for (const [, entry] of String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const link = entry.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ?? '';
    const id = entry.match(/<yt:videoId>([\w-]{6,20})<\/yt:videoId>/)?.[1];
    if (!id || !link.includes('/watch?v=')) continue;
    return {videoId: id, title: decode(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''), published: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? null};
  }
  return null;
}

/** The video with the channel's uploads ("UU…") as its playlist. */
export const videoUrl = (show, video) => `https://www.youtube.com/watch?v=${video.videoId}&list=UU${channels[show].channel.slice(2)}`;

const cache = new Map();
const FRESH = 15 * 60_000;

/** Newest video of a show, cached for 15 minutes; an older answer is kept when YouTube fails. */
export async function latest(show, fetcher = fetch, now = Date.now()) {
  const known = cache.get(show);
  if (known && now - known.at < FRESH) return known.video;
  try {
    const response = await fetcher(`https://www.youtube.com/feeds/videos.xml?channel_id=${channels[show].channel}`, {signal: AbortSignal.timeout(4000)});
    if (!response.ok) throw new Error(String(response.status));
    const video = latestFromFeed(await response.text());
    if (video) cache.set(show, {at: now, video});
    return video ?? known?.video ?? null;
  } catch {
    return known?.video ?? null;
  }
}

/** Where a show opens now: its newest video, else its channel page. */
export async function showLink(show, fetcher = fetch) {
  const video = channels[show].channel ? await latest(show, fetcher) : null;
  return video ? {url: videoUrl(show, video), title: video.title, published: video.published} : {url: channels[show].page, title: null, published: null};
}

export function newsRoutes(app) {
  app.get('/api/v1/news', async (_req, res) => {
    const ids = Object.keys(channels);
    const links = await Promise.all(ids.map((id) => showLink(id)));
    res.set('Cache-Control', 'public, max-age=300');
    res.json({shows: Object.fromEntries(ids.map((id, index) => [id, links[index]]))});
  });
  app.get('/nieuws/:show', async (req, res) => {
    if (!Object.hasOwn(channels, req.params.show)) return res.redirect(302, '/leren');
    res.set('Cache-Control', 'no-store');
    res.redirect(302, (await showLink(req.params.show)).url);
  });
}
