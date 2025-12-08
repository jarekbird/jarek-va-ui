import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

/**
 * Global test setup file for Vitest
 *
 * This file configures:
 * - jest-dom matchers for better assertions (toBeInTheDocument, etc.)
 * - MSW (Mock Service Worker) server for network request mocking
 * - Global cleanup after each test to prevent test pollution
 * - Mock restoration to ensure tests are isolated
 * - Timer restoration to prevent hanging tests
 *
 * The jsdom environment is configured in vitest.config.ts
 *
 * Note: MSW is enabled globally, but tests that manually mock `globalThis.fetch`
 * will have their mocks take precedence. MSW handlers are available for component
 * tests and integration tests that don't use manual fetch mocks.
 */

// MSW server lifecycle management
// Start server before all tests
// Use 'bypass' for onUnhandledRequest to allow manual mocks in existing API tests
// Note: API tests that manually mock `globalThis.fetch` will have their mocks work
// because MSW uses 'bypass' mode, but MSW still intercepts matching requests first.
// For API tests, we need to ensure handlers don't conflict with manual mocks.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

// Reset handlers between tests to ensure test isolation
afterEach(() => {
  server.resetHandlers();
  cleanup();
  vi.restoreAllMocks();
  // Restore real timers if fake timers were used
  if (vi.isFakeTimers()) {
    vi.useRealTimers();
  }
});

// Close server after all tests complete
afterAll(() => {
  server.close();
});
