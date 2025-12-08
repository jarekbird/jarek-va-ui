import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * Global test setup file for Vitest
 *
 * This file configures:
 * - jest-dom matchers for better assertions (toBeInTheDocument, etc.)
 * - Global cleanup after each test to prevent test pollution
 * - Mock restoration to ensure tests are isolated
 * - Timer restoration to prevent hanging tests
 *
 * The jsdom environment is configured in vitest.config.ts
 */
// Global cleanup after each test
// This ensures all tests clean up properly to prevent hanging
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  // Restore real timers if fake timers were used
  if (vi.isFakeTimers()) {
    vi.useRealTimers();
  }
});
