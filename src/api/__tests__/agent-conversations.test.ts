import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listAgentConversations,
  getAgentConversation,
  createAgentConversation,
} from '../agent-conversations';
import type { AgentConversation } from '../../types/agent-conversation';

// Mock fetch globally
const mockFetch = vi.fn();
// Mock global fetch
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('agent-conversations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable - unstub to use default
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listAgentConversations', () => {
    it('fetches and returns a list of agent conversations', async () => {
      const mockConversations: AgentConversation[] = [
        {
          conversationId: 'agent-conv-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-01T00:00:00Z',
        },
      ];

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockConversations,
      });

      const result = await listAgentConversations();
      expect(result).toEqual(mockConversations);
      expect(mockFetch).toHaveBeenCalledWith('/agent-conversations/api/list');
    });

    it('throws an error when fetch fails', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({}),
      });

      await expect(listAgentConversations()).rejects.toThrow(
        'Failed to fetch agent conversations: Internal Server Error'
      );
    });

    it('uses custom base URL when VITE_ELEVENLABS_AGENT_URL is set', async () => {
      vi.stubEnv('VITE_ELEVENLABS_AGENT_URL', 'http://localhost:3004');

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => [],
      });

      await listAgentConversations();
      // Agent conversation API always uses relative path, served by cursor-runner
      expect(mockFetch).toHaveBeenCalledWith(
        '/agent-conversations/api/list'
      );
    });
  });

  describe('getAgentConversation', () => {
    it('fetches and returns an agent conversation by ID', async () => {
      const mockConversation: AgentConversation = {
        conversationId: 'agent-conv-1',
        messages: [
          {
            role: 'user',
            content: 'Hello',
            timestamp: '2025-01-01T00:00:00Z',
            source: 'voice',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockConversation,
      });

      const result = await getAgentConversation('agent-conv-1');
      expect(result).toEqual(mockConversation);
      expect(mockFetch).toHaveBeenCalledWith(
        '/agent-conversations/api/agent-conv-1'
      );
    });

    it('throws "Agent conversation not found" error for 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Not found' }),
      });

      await expect(getAgentConversation('nonexistent')).rejects.toThrow(
        'Agent conversation not found'
      );
    });

    it('throws generic error for other HTTP errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({}),
      });

      await expect(getAgentConversation('agent-conv-1')).rejects.toThrow(
        'Failed to fetch agent conversation: Internal Server Error'
      );
    });
  });

  describe('createAgentConversation', () => {
    it('creates a new agent conversation', async () => {
      const mockResponse = {
        success: true,
        conversationId: 'agent-conv-new',
        message: 'Agent conversation created',
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockResponse,
      });

      const result = await createAgentConversation();
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/agent-conversations/api/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
    });

    it('creates a new agent conversation with agentId and metadata', async () => {
      const mockResponse = {
        success: true,
        conversationId: 'agent-conv-new',
        message: 'Agent conversation created',
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockResponse,
      });

      const request = {
        agentId: 'agent-123',
        metadata: { key: 'value' },
      };

      const result = await createAgentConversation(request);
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith('/agent-conversations/api/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
    });

    it('throws an error when creation fails', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({}),
      });

      await expect(createAgentConversation()).rejects.toThrow(
        'Failed to create agent conversation: Internal Server Error'
      );
    });
  });
});


