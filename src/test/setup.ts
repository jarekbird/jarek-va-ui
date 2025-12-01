import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

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
