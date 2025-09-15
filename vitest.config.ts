import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: [],
    root: __dirname,
    environment: 'node',
    globals: true,
  },
});

