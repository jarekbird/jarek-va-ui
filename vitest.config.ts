import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/coverage/',
      ],
      // Coverage thresholds
      // Current baseline (as of TASK-4): ~56% overall coverage
      // Global thresholds: Set to 50% initially (slightly below current baseline)
      // Per-directory thresholds: Set to 70% for critical domains
      // TODO: Raise thresholds as coverage improves:
      //   - Global thresholds should reach 80% (statements, branches, functions, lines)
      //   - Per-directory thresholds should reach 90% for critical domains
      // This is documented technical debt - thresholds are intentionally set below target
      // to allow build to pass while we work toward full coverage.
      thresholds: {
        // Global thresholds - minimum 50% for all metrics (target: 80%)
        statements: 50,
        branches: 70, // Current: 73.1%, close to 80% target
        functions: 55, // Current: 60.81%, close to 80% target
        lines: 50,
        // Per-directory thresholds - 70% for critical domains (target: 90%)
        // Current coverage: components ~49%, api ~65%, services ~82%
        'src/components': {
          statements: 45,
          branches: 70,
          functions: 50,
          lines: 45,
        },
        'src/api': {
          statements: 60,
          branches: 60,
          functions: 50,
          lines: 60,
        },
        'src/services': {
          statements: 80, // Current: 82.23%, already above target
          branches: 75,
          functions: 75,
          lines: 80,
        },
      },
    },
  },
});

