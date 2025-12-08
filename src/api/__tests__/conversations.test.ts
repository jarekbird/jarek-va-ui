import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listConversations,
  getConversationById,
  fetchConversations,
} from '../conversations';
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
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockConversations,
      });

      const result = await listConversations();
      expect(result).toEqual(mockConversations);
      // Check that URL ends with expected path (handles both relative and absolute URLs)
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toMatch(/\/conversations\/api\/list$/);
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
        json: async () => ({}), // Empty object so it falls back to statusText
      });

      await expect(listConversations()).rejects.toThrow(
        'Failed to fetch conversations: Internal Server Error'
      );
    });

    it('uses default API base URL when environment variable is not set', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => [],
      });

      await listConversations();
      // Check that URL ends with expected path (handles both relative and absolute URLs)
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toMatch(/\/conversations\/api\/list$/);
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
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockConversation,
      });

      const result = await getConversationById('conv-1');
      expect(result).toEqual(mockConversation);
      // Check that URL ends with expected path (handles both relative and absolute URLs)
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toMatch(/\/conversations\/api\/conv-1$/);
    });

    it('throws "Conversation not found" error for 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Not found' }),
      });

      await expect(getConversationById('nonexistent')).rejects.toThrow(
        'Note session not found'
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
        json: async () => ({}), // Empty object so it falls back to statusText
      });

      await expect(getConversationById('conv-1')).rejects.toThrow(
        'Failed to fetch conversation: Internal Server Error'
      );
    });
  });

  describe('fetchConversations', () => {
    it('fetches conversations without params', async () => {
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
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockConversations,
      });

      const result = await fetchConversations();
      expect(result.conversations).toEqual(mockConversations);
      // Check that URL ends with expected path (handles both relative and absolute URLs)
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toMatch(/\/conversations\/api\/list$/);
    });

    it('fetches conversations with pagination params', async () => {
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
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockConversations,
      });

      const result = await fetchConversations({ page: 1, limit: 10 });
      expect(result.conversations).toEqual(mockConversations);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      // Check that URL ends with expected path and query params (handles both relative and absolute URLs)
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toMatch(/\/conversations\/api\/list\?page=1&limit=10$/);
    });

    it('fetches conversations with filter params', async () => {
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
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          conversations: mockConversations,
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        }),
      });

      const result = await fetchConversations({
        page: 1,
        limit: 10,
        status: 'active',
        agent: 'test-agent',
      });
      expect(result.conversations).toEqual(mockConversations);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
      // Check that URL contains expected path and query params (handles both relative and absolute URLs)
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toMatch(/\/conversations\/api\/list\?/);
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('limit=10');
      expect(callUrl).toContain('status=active');
      expect(callUrl).toContain('agent=test-agent');
    });

    it('handles array response (legacy format)', async () => {
      const mockConversations: Conversation[] = [
        {
          conversationId: 'conv-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-01T00:00:00Z',
        },
        {
          conversationId: 'conv-2',
          messages: [],
          createdAt: '2025-01-02T00:00:00Z',
          lastAccessedAt: '2025-01-02T00:00:00Z',
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

      const result = await fetchConversations({ page: 1, limit: 10 });
      expect(result.conversations).toEqual(mockConversations);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
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

      await expect(fetchConversations()).rejects.toThrow(
        'Failed to fetch conversations: Internal Server Error'
      );
    });
  });
});
