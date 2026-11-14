import path from 'node:path';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Relative asset URLs keep /leren.html (the OAuth callback alias) working from the same build.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
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
