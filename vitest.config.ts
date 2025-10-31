import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        '.svelte-kit/**',
        'src/lib/pocketbase.ts',
        'src/lib/types/**',
        'src/routes/messages/**',
        'src/routes/trades/**',
        'src/routes/users/**',
        'src/routes/listings/*/manage/**',
        'src/routes/listings/*/photos/**',
      ],
    },
    exclude: ['coverage/**', 'dist/**', '**/node_modules/**', 'tests/e2e/**'],
    // Force Svelte to compile for client-side (not SSR)
    alias: {
      'svelte/internal/server': 'svelte/internal/client',
    },
  },
  resolve: {
    conditions: ['browser'],
  },
});
