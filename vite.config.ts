import path from 'node:path';
import {defineConfig} from 'vite';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {alias: {'@': path.resolve(import.meta.dirname, 'src')}},
  // Most of the app chunk is lesson content and the translation pack, which every screen needs.
  build: {chunkSizeWarningLimit: 1100},
});
