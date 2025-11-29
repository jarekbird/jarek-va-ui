import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useConversationsQuery,
  conversationsQueryKeys,
} from '../useConversationsQuery';
import { fetchConversations } from '../../api/conversations';
import type { Conversation } from '../../types';

// Mock the fetchConversations function
vi.mock('../../api/conversations', () => ({
  fetchConversations: vi.fn(),
}));

const mockFetchConversations = vi.mocked(fetchConversations);

// Helper to create a test QueryClient
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

// Wrapper component for testing hooks
const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useConversationsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('query keys', () => {
    it('generates correct query keys', () => {
      expect(conversationsQueryKeys.all).toEqual(['conversations']);
      expect(conversationsQueryKeys.lists()).toEqual(['conversations', 'list']);
      expect(conversationsQueryKeys.list()).toEqual([
        'conversations',
        'list',
        undefined,
      ]);
      expect(conversationsQueryKeys.list({ page: 1, limit: 10 })).toEqual([
        'conversations',
        'list',
        { page: 1, limit: 10 },
      ]);
      expect(
        conversationsQueryKeys.list({ page: 2, limit: 20, status: 'active' })
      ).toEqual([
        'conversations',
        'list',
        { page: 2, limit: 20, status: 'active' },
      ]);
    });
  });

  describe('successful fetch', () => {
    it('fetches conversations without params', async () => {
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

      mockFetchConversations.mockResolvedValueOnce({
        conversations: mockConversations,
      });

      const { result } = renderHook(() => useConversationsQuery(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        conversations: mockConversations,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFetchConversations).toHaveBeenCalledWith(undefined);
    });

    it('fetches conversations with filter/pagination params', async () => {
      const mockConversations: Conversation[] = [
        {
          conversationId: 'conv-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const params = { page: 1, limit: 10, status: 'active' };
      mockFetchConversations.mockResolvedValueOnce({
        conversations: mockConversations,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useConversationsQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        conversations: mockConversations,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      expect(mockFetchConversations).toHaveBeenCalledWith(params);
    });

    it('uses different query keys for different params', async () => {
      const mockConversations1: Conversation[] = [
        {
          conversationId: 'conv-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const mockConversations2: Conversation[] = [
        {
          conversationId: 'conv-2',
          messages: [],
          createdAt: '2025-01-02T00:00:00Z',
          lastAccessedAt: '2025-01-02T00:00:00Z',
        },
      ];

      mockFetchConversations
        .mockResolvedValueOnce({
          conversations: mockConversations1,
        })
        .mockResolvedValueOnce({
          conversations: mockConversations2,
        });

      const queryClient = createTestQueryClient();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result: result1 } = renderHook(
        () => useConversationsQuery({ page: 1, limit: 10 }),
        { wrapper }
      );

      const { result: result2 } = renderHook(
        () => useConversationsQuery({ page: 2, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Both queries should have different data cached
      expect(result1.current.data?.conversations).toEqual(mockConversations1);
      expect(result2.current.data?.conversations).toEqual(mockConversations2);
    });
  });

  describe('error handling', () => {
    it('handles fetch errors', async () => {
      const errorMessage = 'Failed to fetch conversations: Network Error';
      mockFetchConversations.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useConversationsQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('options', () => {
    it('respects enabled option', async () => {
      const { result } = renderHook(
        () => useConversationsQuery(undefined, { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should not run when enabled is false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockFetchConversations).not.toHaveBeenCalled();
    });

    it('respects custom staleTime option', async () => {
      const mockConversations: Conversation[] = [
        {
          conversationId: 'conv-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-01T00:00:00Z',
        },
      ];

      mockFetchConversations.mockResolvedValueOnce({
        conversations: mockConversations,
      });

      const { result } = renderHook(
        () => useConversationsQuery(undefined, { staleTime: 10000 }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The query should use the custom staleTime
      expect(result.current.data).toBeDefined();
    });
  });
});
