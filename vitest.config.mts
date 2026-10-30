import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './'),
      'server-only': path.resolve(import.meta.dirname, './tests/mocks/empty.ts'),
    },
  },
});
