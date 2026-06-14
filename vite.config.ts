import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
// `base` управляет префиксом путей к ассетам. Локально — корень («/»), а на
// GitHub Pages проект отдаётся из /<repo>/, поэтому в CI выставляем VITE_BASE.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
});
