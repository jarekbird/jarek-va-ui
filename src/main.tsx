import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

/**
 * Detect whether the app is being served behind a path prefix (e.g. /conversations)
 * so React Router can trim the prefix before matching routes. This allows the same
 * build to work both at the root (local dev) and behind Traefik prefixes in prod.
 */
const SUPPORTED_BASENAMES = ['/conversations'];

const detectBasename = (): string => {
  if (typeof window === 'undefined') {
    return '/';
  }

  const { pathname } = window.location;
  const match = SUPPORTED_BASENAMES.find(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
  return match ?? '/';
};

const basename = detectBasename();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename === '/' ? undefined : basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
