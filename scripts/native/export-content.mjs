// Writes ios-native/Nedfa/Resources/content.json and config.json for the SwiftUI app.
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {buildNativeContent} from '../../src/core/native-content.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'ios-native/Nedfa/Resources/content.json');
const content = buildNativeContent();
await mkdir(path.dirname(OUT), {recursive: true});
await writeFile(OUT, JSON.stringify(content));
// Public Supabase settings (the same values every website visitor receives), for sign-in and sync.
let url = process.env.PUBLIC_SUPABASE_URL || '';
let key = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
if (!url || !key) ({url, key} = await (await fetch('https://nedfa.nl/deployment-config.json')).json());
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !key?.startsWith('sb_publishable_')) throw new Error('Missing public Supabase settings.');
await writeFile(path.join(path.dirname(OUT), 'config.json'), JSON.stringify({supabaseUrl: url, supabaseKey: key}));
console.log(`Native content: ${content.cards.length} cards, ${content.themes.length} themes, ${content.patterns.length} patterns → ${path.relative(ROOT, OUT)}`);
