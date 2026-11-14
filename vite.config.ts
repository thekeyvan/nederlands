import path from 'node:path';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';

// Relative asset URLs keep /leren.html (the OAuth callback alias) working from the same build.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'Mijn Nederlands',
        short_name: 'Nederlands',
        description: 'Elke dag een beetje Nederlands, als een spel: thema’s, audio, spellen en slim herhalen voor A2–B1.',
        lang: 'nl',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'any',
        background_color: '#fcfaf6',
        theme_color: '#fcfaf6',
        categories: ['education', 'games'],
        icons: [
          {src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
          {src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
          {src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
        ],
        shortcuts: [
          {name: 'Oefenen', short_name: 'Oefenen', url: './#oefenen', icons: [{src: 'icon-192.png', sizes: '192x192'}]},
          {name: 'Spellen', short_name: 'Spellen', url: './#spellen', icons: [{src: 'icon-192.png', sizes: '192x192'}]},
          {name: 'Thema’s', short_name: 'Thema’s', url: './#woorden', icons: [{src: 'icon-192.png', sizes: '192x192'}]},
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,jpg,png,svg}'],
        globIgnores: ['assets/audio/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {enabled: false},
    }),
  ],
  resolve: {alias: {'@': path.resolve(import.meta.dirname, 'src')}},
  build: {
    // Most of the main chunk is lesson content and the translation pack, which every screen needs.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        bronnen: path.resolve(import.meta.dirname, 'bronnen.html'),
        privacy: path.resolve(import.meta.dirname, 'privacy.html'),
      },
    },
  },
});
