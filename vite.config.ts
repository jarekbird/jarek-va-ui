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
    watch: {
      usePolling: true, // Required for Docker volume mounts
    },
    proxy: {
      // Proxy /conversations/api/* to cursor-runner backend
      '/conversations/api': {
        target: 'http://cursor-runner:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/conversations\/api/, '/api'),
      },
      // Proxy /agent-session/* to elevenlabs-agent for session registration
      '/agent-session': {
        target: 'http://elevenlabs-agent:3004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent-session\/([^/]+)$/, '/agent-conversations/api/$1/session'),
      },
      // Proxy /agent-conversations/api/* to cursor-runner backend
      '/agent-conversations/api': {
        target: 'http://cursor-runner:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent-conversations\/api/, '/api/agent'),
      },
      // Proxy /api/* directly to cursor-runner backend
      '/api': {
        target: 'http://cursor-runner:3001',
        changeOrigin: true,
      },
      // Proxy ElevenLabs agent API endpoints (when using relative paths)
      '/signed-url': {
        target: 'http://elevenlabs-agent:3004',
        changeOrigin: true,
      },
      '/config': {
        target: 'http://elevenlabs-agent:3004',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

