import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react({
      disableOxcRecommendation: true,
      parserConfig: (id) => {
        if (id.endsWith('.jsx') || id.endsWith('.js')) {
          return { syntax: 'ecmascript', jsx: true };
        }
        if (id.endsWith('.tsx')) return { syntax: 'typescript', tsx: true };
        if (id.endsWith('.ts')) return { syntax: 'typescript', tsx: false };
        return undefined;
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}', 'scripts/**/*.{test,spec}.js'],
  },
});
