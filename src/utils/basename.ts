/**
 * Detect whether the app is being served behind a path prefix (e.g. /conversations)
 * so React Router can trim the prefix before matching routes. This allows the same
 * build to work both at the root (local dev) and behind Traefik prefixes in prod.
 */
const SUPPORTED_BASENAMES = ['/conversations'];

export const detectBasename = (): string => {
  if (typeof window === 'undefined') {
    return '/';
  }

  const { pathname } = window.location;
  const match = SUPPORTED_BASENAMES.find(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
  return match ?? '/';
};
