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
      // Proxy /agent-conversations/api/* with conditional routing based on path
      '/agent-conversations/api': {
        target: 'http://cursor-runner:3001',
        changeOrigin: true,
        router: (req) => {
          // Route session endpoints to elevenlabs-agent
          if (req.url && req.url.match(/\/agent-conversations\/api\/[^/]+\/session$/)) {
            return 'http://elevenlabs-agent:3004';
          }
          // Route other endpoints to cursor-runner
          return 'http://cursor-runner:3001';
        },
        rewrite: (path) => {
          // Keep original path for session endpoints (going to elevenlabs-agent)
          if (path.match(/\/agent-conversations\/api\/[^/]+\/session$/)) {
            return path;
          }
          // Rewrite path for cursor-runner endpoints
          return path.replace(/^\/agent-conversations\/api/, '/api/agent');
        },
      },
      // Proxy /api/* directly to cursor-runner backend
      '/api': {
        target: 'http://cursor-runner:3001',
        changeOrigin: true,
      },
      // Proxy repositories API to cursor-runner backend
      '/repositories/api': {
        target: 'http://cursor-runner:3001',
        changeOrigin: true,
      },
      // Proxy cursor-agents API endpoints
      '/agents': {
        target: 'http://cursor-agents:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agents/, ''),
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

