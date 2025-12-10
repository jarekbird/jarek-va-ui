import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getApiBasePath } from '../api-base';

describe('getApiBasePath', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    // Clear any existing window mock
    if (globalThis.window) {
      delete (globalThis as { window?: typeof window }).window;
    }
  });

  afterEach(() => {
    // Restore original window if it existed
    if (originalWindow) {
      (globalThis as { window: typeof window }).window = originalWindow;
    }
  });

  it('returns /api when window is undefined (Node.js/test environment)', () => {
    // Ensure window is undefined
    expect(typeof window).toBe('undefined');
    const result = getApiBasePath();
    expect(result).toBe('/api');
  });

  it('returns /conversations/api when pathname is exactly /conversations', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '/conversations',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/conversations/api');
  });

  it('returns /conversations/api when pathname starts with /conversations/', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '/conversations/chat',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/conversations/api');
  });

  it('returns /conversations/api when pathname is /conversations/something/else', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '/conversations/something/else',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/conversations/api');
  });

  it('returns /api when pathname is /', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '/',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/api');
  });

  it('returns /api when pathname is /dashboard', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '/dashboard',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/api');
  });

  it('returns /api when pathname is /api/tasks', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '/api/tasks',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/api');
  });

  it('returns /api when pathname is /some/other/path', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '/some/other/path',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/api');
  });

  it('returns /api when pathname is empty string', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/api');
  });

  it('handles pathname that contains /conversations but does not start with it', () => {
    // Mock window object
    Object.defineProperty(globalThis, 'window', {
      value: {
        location: {
          pathname: '/api/conversations',
        },
      },
      writable: true,
      configurable: true,
    });

    const result = getApiBasePath();
    expect(result).toBe('/api');
  });
});
