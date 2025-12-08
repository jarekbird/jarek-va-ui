/**
 * MSW (Mock Service Worker) server configuration
 *
 * This file creates and exports an MSW server instance configured with all handlers.
 * The server is used in the test setup to intercept network requests during test execution.
 *
 * For Node.js environments (Vitest), we use `setupServer` from `msw/node`.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance configured with all API handlers
 *
 * This server intercepts network requests in tests and returns mocked responses
 * based on the handlers defined in `handlers.ts`.
 *
 * Usage in tests:
 * - The server is started in `src/test/setup.ts` before all tests
 * - Handlers are reset between tests to ensure test isolation
 * - The server is closed after all tests complete
 */
export const server = setupServer(...handlers);
