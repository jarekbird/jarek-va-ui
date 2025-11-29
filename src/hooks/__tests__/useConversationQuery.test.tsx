import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useConversationQuery,
  conversationQueryKeys,
} from '../useConversationQuery';
import { fetchConversation } from '../../api/conversations';
import type { Conversation } from '../../types';

// Mock the fetchConversation function
vi.mock('../../api/conversations', () => ({
  fetchConversation: vi.fn(),
}));

const mockFetchConversation = vi.mocked(fetchConversation);

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

describe('useConversationQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('query keys', () => {
    it('generates correct query keys', () => {
      expect(conversationQueryKeys.all).toEqual(['conversation']);
      expect(conversationQueryKeys.detail('conv-1')).toEqual([
        'conversation',
        'conv-1',
      ]);
      expect(conversationQueryKeys.detail('conv-2')).toEqual([
        'conversation',
        'conv-2',
      ]);
    });
  });

  describe('successful fetch', () => {
    it('fetches a conversation by ID', async () => {
      const mockConversation: Conversation = {
        conversationId: 'conv-1',
        messages: [
          {
            role: 'user',
            content: 'Hello',
            timestamp: '2025-01-01T00:00:00Z',
          },
          {
            role: 'assistant',
            content: 'Hi there!',
            timestamp: '2025-01-01T00:00:01Z',
          },
        ],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:01Z',
      };

      mockFetchConversation.mockResolvedValueOnce(mockConversation);

      const { result } = renderHook(() => useConversationQuery('conv-1'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConversation);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFetchConversation).toHaveBeenCalledWith('conv-1');
    });

    it('uses different query keys for different conversation IDs', async () => {
      const mockConversation1: Conversation = {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      const mockConversation2: Conversation = {
        conversationId: 'conv-2',
        messages: [],
        createdAt: '2025-01-02T00:00:00Z',
        lastAccessedAt: '2025-01-02T00:00:00Z',
      };

      mockFetchConversation
        .mockResolvedValueOnce(mockConversation1)
        .mockResolvedValueOnce(mockConversation2);

      const queryClient = createTestQueryClient();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result: result1 } = renderHook(
        () => useConversationQuery('conv-1'),
        { wrapper }
      );

      const { result: result2 } = renderHook(
        () => useConversationQuery('conv-2'),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Both queries should have different data cached
      expect(result1.current.data).toEqual(mockConversation1);
      expect(result2.current.data).toEqual(mockConversation2);
    });
  });

  describe('error handling', () => {
    it('handles fetch errors', async () => {
      const errorMessage = 'Conversation not found';
      mockFetchConversation.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useConversationQuery('nonexistent'), {
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
        () => useConversationQuery('conv-1', { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should not run when enabled is false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockFetchConversation).not.toHaveBeenCalled();
    });

    it('disables query when conversationId is empty', async () => {
      const { result } = renderHook(() => useConversationQuery(''), {
        wrapper: createWrapper(),
      });

      // Query should not run when conversationId is empty
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockFetchConversation).not.toHaveBeenCalled();
    });

    it('respects custom staleTime option', async () => {
      const mockConversation: Conversation = {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      mockFetchConversation.mockResolvedValueOnce(mockConversation);

      const { result } = renderHook(
        () => useConversationQuery('conv-1', { staleTime: 10000 }),
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
