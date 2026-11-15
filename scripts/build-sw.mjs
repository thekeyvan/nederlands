// Builds the service worker after `react-router build` and gives it the list of files to keep for offline use.
import {build} from 'vite';
import {injectManifest} from 'workbox-build';

const out = 'build/client';
await build({
  configFile: false,
  logLevel: 'warn',
  define: {'process.env.NODE_ENV': JSON.stringify('production')},
  build: {outDir: out, emptyOutDir: false, copyPublicDir: false, lib: {entry: 'src/sw.ts', formats: ['iife'], name: 'nedfaSW', fileName: () => 'sw.js'}},
});
const {count, size, warnings} = await injectManifest({
  swSrc: `${out}/sw.js`,
  swDest: `${out}/sw.js`,
  globDirectory: out,
  // The app's code, styles, fonts and pictures; audio is cached when played (see sw.ts).
  globPatterns: ['assets/**/*.{js,css,woff2,jpg,png,svg,webp}', 'img/logo.png', 'icon-*.png', 'favicon.png', 'manifest.webmanifest'],
  globIgnores: ['assets/audio/**'],
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
});
for (const warning of warnings) console.warn(warning);
console.log(`Service worker: ${count} files (${(size / 1024 / 1024).toFixed(1)} MB) for offline use.`);
