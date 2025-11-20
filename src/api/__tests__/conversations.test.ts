import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listConversations, getConversationById } from '../conversations';
import type { Conversation } from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
// Mock global fetch
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('conversations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listConversations', () => {
    it('fetches and returns a list of conversations', async () => {
      const mockConversations: Conversation[] = [
        {
          conversationId: 'conv-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-01T00:00:00Z',
        },
      ];

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversations,
      });

      const result = await listConversations();
      expect(result).toEqual(mockConversations);
      expect(mockFetch).toHaveBeenCalledWith('/conversations/api/list');
    });

    it('throws an error when fetch fails', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(listConversations()).rejects.toThrow(
        'Failed to fetch conversations: Internal Server Error'
      );
    });

    it('uses default API base URL when environment variable is not set', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await listConversations();
      // Should use default '/conversations/api' when VITE_API_BASE_URL is not set
      expect(mockFetch).toHaveBeenCalledWith('/conversations/api/list');
    });
  });

  describe('getConversationById', () => {
    it('fetches and returns a conversation by ID', async () => {
      const mockConversation: Conversation = {
        conversationId: 'conv-1',
        messages: [
          {
            role: 'user',
            content: 'Hello',
            timestamp: '2025-01-01T00:00:00Z',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversation,
      });

      const result = await getConversationById('conv-1');
      expect(result).toEqual(mockConversation);
      expect(mockFetch).toHaveBeenCalledWith('/conversations/api/conv-1');
    });

    it('throws "Conversation not found" error for 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(getConversationById('nonexistent')).rejects.toThrow(
        'Conversation not found'
      );
    });

    it('throws generic error for other HTTP errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getConversationById('conv-1')).rejects.toThrow(
        'Failed to fetch conversation: Internal Server Error'
      );
    });
  });
});
