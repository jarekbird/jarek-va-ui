import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const cursorRunnerTarget =
  process.env.VITE_CURSOR_RUNNER_PROXY_TARGET || 'http://localhost:3001';
const elevenLabsAgentTarget =
  process.env.VITE_ELEVENLABS_AGENT_PROXY_TARGET || 'http://localhost:3004';
const cursorAgentsTarget =
  process.env.VITE_CURSOR_AGENTS_PROXY_TARGET || 'http://localhost:3002';

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
        target: cursorRunnerTarget,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/conversations\/api/, '/api'),
      },
      // Proxy /agent-session/* to elevenlabs-agent for session registration
      '/agent-session': {
        target: elevenLabsAgentTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent-session\/([^/]+)$/, '/agent-conversations/api/$1/session'),
      },
      // Proxy /agent-conversations/api/* with conditional routing based on path
      '/agent-conversations/api': {
        target: cursorRunnerTarget,
        changeOrigin: true,
        ws: true,
        router: (req) => {
          // Route session endpoints to elevenlabs-agent
          if (req.url && req.url.match(/\/agent-conversations\/api\/[^/]+\/session$/)) {
            return elevenLabsAgentTarget;
          }
          // Route other endpoints to cursor-runner
          return cursorRunnerTarget;
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
        target: cursorRunnerTarget,
        changeOrigin: true,
        ws: true,
      },
      // Proxy repositories API to cursor-runner backend
      '/repositories/api': {
        target: cursorRunnerTarget,
        changeOrigin: true,
        ws: true,
      },
      // Proxy cursor-agents API endpoints
      '/agents': {
        target: cursorAgentsTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agents/, ''),
      },
      // Proxy ElevenLabs agent API endpoints (when using relative paths)
      '/signed-url': {
        target: elevenLabsAgentTarget,
        changeOrigin: true,
      },
      '/config': {
        target: elevenLabsAgentTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

