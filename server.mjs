// Production server (Railway): static files, security headers, old-URL redirects and React Router's server rendering.
import compression from 'compression';
import express from 'express';
import {createRequestHandler} from '@react-router/express';
import {accountApi} from './server/api.mjs';
import {migrate} from './server/db.mjs';
import {statsProxy} from './server/stats.mjs';
import {newsRoutes} from './server/news.mjs';

const build = await import('./build/server/index.js');
// Accounts live in Railway Postgres; without DATABASE_URL the site runs with progress on the device only.
await migrate().catch((error) => console.error('database', error.message));
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(compression());

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000',
  });
  // One address for everyone: https://nedfa.nl (the old Vercel domain and www redirect here).
  const host = req.hostname;
  if (host === 'www.nedfa.nl' || host === 'nederlands.keyvanmahmoudi.com') return res.redirect(301, `https://nedfa.nl${req.originalUrl}`);
  next();
});

// Clean addresses without .html; old links keep working (the browser keeps the #screen part).
const query = (req) => (req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '');
app.get('/leren.html', (req, res) => res.redirect(301, `/leren${query(req)}`));
app.get('/privacy.html', (req, res) => res.redirect(301, `/privacy${query(req)}`));
app.get('/bronnen.html', (_req, res) => res.redirect(301, '/leren#bronnen'));
// The first offline version's service worker answers every page with /index.html, which no longer exists.
// Serve the app page there (no redirect: service workers reject redirected page responses), so the app loads and installs the new worker.
app.get('/index.html', (req, _res, next) => { req.url = req.originalUrl = `/leren${query(req)}`; next(); });

// Dutch moved from /nl/ to the root.
app.get(['/nl', '/nl/{*rest}'], (req, res) => res.redirect(301, req.originalUrl.replace(/^\/nl/, '') || '/'));
app.get('/health', (_req, res) => res.type('text').send('ok'));
// Before /api and React Router: /api/v1/news and /nieuws/:show (the newest NOS video).
newsRoutes(app);
app.use('/api', accountApi());
app.use('/stats', statsProxy());

// Files with a hash in their name never change; audio and pictures change rarely; the service worker must be fresh.
app.use('/assets/audio', express.static('build/client/assets/audio', {maxAge: '7d'}));
app.use('/assets', express.static('build/client/assets', {immutable: true, maxAge: '1y'}));
const fresh = /(?:\/sw\.js|\.webmanifest)$/;
app.use(express.static('build/client', {maxAge: '1h', index: false, redirect: false, setHeaders: (res, file) => { if (fresh.test(file)) res.setHeader('Cache-Control', 'no-cache'); }}));

app.all('/{*path}', createRequestHandler({build, mode: process.env.NODE_ENV}));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Nedfa on http://localhost:${port}`));
