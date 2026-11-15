// Copies the theme and game scenes from the app, plus the site illustrations, to public/img/ under stable URLs.
import {copyFile, mkdir, readdir} from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public/img');
const copyDir = async (from, to, filter = () => true) => {
  await mkdir(to, {recursive: true});
  for (const file of await readdir(from)) if (filter(file)) await copyFile(path.join(from, file), path.join(to, file));
};
await copyDir(path.join(ROOT, 'src/assets/illustrations/themes'), path.join(OUT, 'themes'), (file) => file.endsWith('.jpg'));
await copyDir(path.join(ROOT, 'src/assets/illustrations/games'), path.join(OUT, 'games'), (file) => file.endsWith('.jpg'));
await copyDir(path.join(ROOT, 'src/site/img'), OUT);
