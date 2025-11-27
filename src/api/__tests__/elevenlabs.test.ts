import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getVoiceSignedUrl,
  registerSession,
  getAgentConfig,
} from '../elevenlabs';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('ElevenLabs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getVoiceSignedUrl', () => {
    it('fetches signed URL for default agent', async () => {
      const mockResponse = {
        signedUrl: 'wss://example.com/signed-url',
        expiresAt: '2025-01-01T12:00:00Z',
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockResponse,
      });

      const result = await getVoiceSignedUrl();
      expect(result.signedUrl).toBe('wss://example.com/signed-url');
      expect(result.expiresAt).toBe('2025-01-01T12:00:00Z');
      // When VITE_ELEVENLABS_AGENT_URL is not set, baseUrl is empty string
      const callArgs = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toMatch(/\/signed-url$/);
      expect(callArgs[1].method).toBe('GET');
    });

    it('fetches signed URL for specific agent', async () => {
      const mockResponse = {
        signedUrl: 'wss://example.com/signed-url',
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockResponse,
      });

      const result = await getVoiceSignedUrl('agent-123');
      expect(result.signedUrl).toBe('wss://example.com/signed-url');
      const callArgs = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toMatch(/\/signed-url\?agentId=agent-123$/);
    });

    it('handles snake_case response format', async () => {
      const mockResponse = {
        signed_url: 'wss://example.com/signed-url',
        expires_at: '2025-01-01T12:00:00Z',
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockResponse,
      });

      const result = await getVoiceSignedUrl();
      expect(result.signedUrl).toBe('wss://example.com/signed-url');
      expect(result.expiresAt).toBe('2025-01-01T12:00:00Z');
    });

    it('handles API errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'API error' }),
      });

      await expect(getVoiceSignedUrl()).rejects.toThrow('API error');
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(getVoiceSignedUrl()).rejects.toThrow();
    });
  });

  describe('registerSession', () => {
    it('registers session successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Session registered',
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockResponse,
      });

      const result = await registerSession('conv-123', {
        sessionUrl: 'wss://example.com/session',
      });

      expect(result.success).toBe(true);
      const callArgs = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(callArgs[0]).toMatch(/\/agent-conversations\/api\/conv-123\/session$/);
      expect(callArgs[1].method).toBe('POST');
      const body = JSON.parse(callArgs[1].body);
      expect(body.sessionUrl).toBe('wss://example.com/session');
    });

    it('handles registration errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Invalid session data' }),
      });

      await expect(
        registerSession('conv-123', { sessionUrl: 'invalid' })
      ).rejects.toThrow('Invalid session data');
    });
  });

  describe('getAgentConfig', () => {
    it('fetches agent configuration', async () => {
      const mockResponse = {
        agentId: 'agent-123',
        agentUrl: 'http://elevenlabs-agent:3004',
        cursorRunnerUrl: 'http://cursor-runner:3001',
        webhookSecretConfigured: true,
        redisUrl: 'configured',
        hasApiKey: true,
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockResponse,
      });

      const result = await getAgentConfig();
      expect(result.agentId).toBe('agent-123');
      expect(result.hasApiKey).toBe(true);
    });
  });
});

