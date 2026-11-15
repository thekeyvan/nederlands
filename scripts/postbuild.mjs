// Runs after `vite build`. Writes public deployment settings and the public pages.
import {writeFile} from 'node:fs/promises';
import {buildSite} from './site/build-site.mjs';
const url=process.env.PUBLIC_SUPABASE_URL || '';
const key=process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
if(Boolean(url)!==Boolean(key))throw new Error('Set both public Supabase settings or neither.');
if(url&&(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!key.startsWith('sb_publishable_')))throw new Error('Use your HTTPS Supabase project URL and a publishable key, never a secret key.');
// Set PUBLIC_APPLE_WEB_SIGNIN=1 once Supabase has the Apple web flow (Services ID and key).
const appleWeb=process.env.PUBLIC_APPLE_WEB_SIGNIN==='1';
await writeFile('dist/deployment-config.json',JSON.stringify(appleWeb?{url,key,appleWeb}:{url,key})+'\n');
await buildSite('dist');
console.log(`Built static site. Account sync: ${url?'configured':'off (local-only fork)'}.`);
