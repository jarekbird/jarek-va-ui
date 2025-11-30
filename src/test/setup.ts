import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Global cleanup after each test
// This ensures all tests clean up properly to prevent hanging
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Note: QueryClient cleanup must be done per-test since each test
// creates its own QueryClient instance. Tests that use QueryClient
// should call queryClient.clear() in their own afterEach hooks.
