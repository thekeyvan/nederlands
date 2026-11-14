// Runs after `vite build`. Writes public deployment settings and the /leren.html alias.
import {copyFile, writeFile} from 'node:fs/promises';
const url=process.env.PUBLIC_SUPABASE_URL || '';
const key=process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
if(Boolean(url)!==Boolean(key))throw new Error('Set both public Supabase settings or neither.');
if(url&&(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)||!key.startsWith('sb_publishable_')))throw new Error('Use your HTTPS Supabase project URL and a publishable key, never a secret key.');
// The old learning URL (and the Google sign-in callback) is an alias of the app entry, not a second template.
await copyFile('dist/index.html','dist/leren.html');
await writeFile('dist/deployment-config.json',JSON.stringify({url,key})+'\n');
console.log(`Built static site. Account sync: ${url?'configured':'off (local-only fork)'}.`);
