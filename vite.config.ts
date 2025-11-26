import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // No base path - Traefik handles the /conversations prefix routing
  // Traefik strips /conversations before forwarding to nginx
  base: '/',
  plugins: [react()],
  server: {
    port: 3002,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

