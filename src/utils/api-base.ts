/**
 * Utility to get the API base path that works in both local and production environments
 *
 * In production with Traefik, the UI is served at /conversations/* and APIs should use /conversations/api/*
 * Locally or when served at root, APIs should use /api/*
 */
export function getApiBasePath(): string {
  if (typeof window === 'undefined') {
    return '/api';
  }

  const { pathname } = window.location;

  // If we're in a /conversations context, use /conversations/api
  if (pathname === '/conversations' || pathname.startsWith('/conversations/')) {
    return '/conversations/api';
  }

  // Otherwise use /api (works locally and when served at root)
  return '/api';
}





