// Builds the web app for the iOS bundle and copies it into the Xcode project.
// Account sync uses the same public Supabase settings as the website.
import {execSync} from 'node:child_process';
import {copyFile, rm, writeFile} from 'node:fs/promises';

const run = (command) => execSync(command, {stdio: 'inherit'});
let url = process.env.PUBLIC_SUPABASE_URL || '';
let key = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
let appleWeb = process.env.PUBLIC_APPLE_WEB_SIGNIN === '1';
if (!url || !key) {
  // Fall back to the live site's public settings (the same values any visitor's browser receives).
  const response = await fetch('https://nederlands.keyvanmahmoudi.com/deployment-config.json');
  ({url, key} = await response.json());
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key?.startsWith('sb_publishable_')) throw new Error('Missing public Supabase settings.');

run('tsc --noEmit');
run('vite build --mode native');
await writeFile('dist-native/deployment-config.json', JSON.stringify(appleWeb ? {url, key, appleWeb} : {url, key}) + '\n');
// Capacitor opens index.html; the app's own links use leren.html, so both exist.
await copyFile('dist-native/leren.html', 'dist-native/index.html');
// The resources redirect page is a website-only alias.
await rm('dist-native/bronnen.html', {force: true});
run('npx cap sync ios');
console.log('iOS bundle ready. Open with: npx cap open ios');
