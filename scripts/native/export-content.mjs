// Writes ios-native/Nedfa/Resources/content.json for the SwiftUI app (accounts use https://nedfa.nl/api).
import {mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {buildNativeContent} from '../../src/core/native-content.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const OUT = path.join(ROOT, 'ios-native/Nedfa/Resources/content.json');
const content = buildNativeContent();
await mkdir(path.dirname(OUT), {recursive: true});
// Same version as /api/v1/version, so the app downloads new content only when it really changed.
const version = createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
await writeFile(OUT, JSON.stringify({version, ...content}));
console.log(`Native content: ${content.cards.length} cards, ${content.themes.length} themes, ${content.patterns.length} patterns → ${path.relative(ROOT, OUT)}`);
