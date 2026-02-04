import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'mixpanel-browser': new URL('./tests/mocks/mixpanel.js', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.js',
        '**/*.d.ts',
        'scripts/',
        'src/components/**',
        'src/main.js',
        'src/services/firebase.js',
        'src/services/sentry.js',
        'src/utils/image.js',
      ],
    },
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
  },
});
