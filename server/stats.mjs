// Visitor statistics with Umami (cookieless, no personal data), served from nedfa.nl itself.
// The Umami service runs on Railway's private network; only the tracker script and the collect endpoint pass through here.
// The dashboard is not proxied: it has its own Railway address.
import express from 'express';

const UMAMI = process.env.UMAMI_URL ?? 'http://umami.railway.internal:3000';
const forward = ['user-agent', 'accept-language', 'content-type', 'x-umami-cache'];

export function statsProxy() {
  const router = express.Router();
  const pass = async (req, res, path, body) => {
    try {
      const headers = Object.fromEntries(forward.filter((name) => req.get(name)).map((name) => [name, req.get(name)]));
      // Umami derives country and device from these, then discards the address.
      headers['x-forwarded-for'] = req.ip;
      const response = await fetch(`${UMAMI}${path}`, {method: req.method, headers, body, signal: AbortSignal.timeout(5000)});
      res.status(response.status);
      for (const name of ['content-type', 'cache-control']) if (response.headers.get(name)) res.set(name, response.headers.get(name));
      res.send(Buffer.from(await response.arrayBuffer()));
    } catch {
      // Statistics must never break the site.
      res.status(path === '/script.js' ? 204 : 202).end();
    }
  };
  router.get('/script.js', (req, res) => pass(req, res, '/script.js'));
  router.post('/api/send', express.text({type: '*/*', limit: '64kb'}), (req, res) => pass(req, res, '/api/send', req.body));
  return router;
}
