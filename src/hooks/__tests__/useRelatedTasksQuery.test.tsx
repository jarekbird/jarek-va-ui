import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useRelatedTasksQuery,
  relatedTasksQueryKeys,
} from '../useRelatedTasksQuery';
import { useTasksQuery } from '../useTasksQuery';
import type { Task } from '../../types';

// Mock the useTasksQuery hook
vi.mock('../useTasksQuery', () => ({
  useTasksQuery: vi.fn(),
}));

const mockUseTasksQuery = vi.mocked(useTasksQuery);

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

describe('useRelatedTasksQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('query keys', () => {
    it('generates correct query keys', () => {
      expect(relatedTasksQueryKeys.all).toEqual(['relatedTasks']);
      expect(relatedTasksQueryKeys.byConversation('conv-123')).toEqual([
        'relatedTasks',
        'conv-123',
      ]);
    });
  });

  describe('successful fetch', () => {
    it('fetches related tasks for a conversation', async () => {
      const mockTasks: Task[] = [
        {
          id: 1,
          prompt: 'Test task 1',
          status: 1,
          status_label: 'ready',
          createdat: '2025-01-01T00:00:00Z',
          updatedat: '2025-01-01T00:00:00Z',
          order: 1,
          uuid: 'uuid-1',
        },
        {
          id: 2,
          prompt: 'Test task 2',
          status: 2,
          status_label: 'complete',
          createdat: '2025-01-02T00:00:00Z',
          updatedat: '2025-01-02T00:00:00Z',
          order: 2,
          uuid: 'uuid-2',
        },
      ];

      mockUseTasksQuery.mockReturnValue({
        data: {
          tasks: mockTasks,
        },
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        status: 'success',
        isInitialLoading: false,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isFetched: true,
        isFetchedAfterMount: true,
      } as unknown as ReturnType<typeof useTasksQuery>);

      const { result } = renderHook(() => useRelatedTasksQuery('conv-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual({
        tasks: mockTasks,
      });
      expect(mockUseTasksQuery).toHaveBeenCalledWith(
        { conversation_id: 'conv-123' },
        expect.objectContaining({
          enabled: true,
        })
      );
    });

    it('passes conversation_id parameter to useTasksQuery', () => {
      mockUseTasksQuery.mockReturnValue({
        data: { tasks: [] },
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        status: 'success',
        isInitialLoading: false,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isFetched: true,
        isFetchedAfterMount: true,
      } as unknown as ReturnType<typeof useTasksQuery>);

      renderHook(() => useRelatedTasksQuery('conv-456'), {
        wrapper: createWrapper(),
      });

      expect(mockUseTasksQuery).toHaveBeenCalledWith(
        { conversation_id: 'conv-456' },
        expect.any(Object)
      );
    });
  });

  describe('options', () => {
    it('respects enabled option', () => {
      mockUseTasksQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        isFetching: false,
        refetch: vi.fn(),
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        status: 'pending',
        isInitialLoading: false,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isFetched: false,
        isFetchedAfterMount: false,
      } as unknown as ReturnType<typeof useTasksQuery>);

      renderHook(() => useRelatedTasksQuery('conv-123', { enabled: false }), {
        wrapper: createWrapper(),
      });

      expect(mockUseTasksQuery).toHaveBeenCalledWith(
        { conversation_id: 'conv-123' },
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('disables query when conversationId is empty', () => {
      mockUseTasksQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: false,
        isFetching: false,
        refetch: vi.fn(),
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        status: 'pending',
        isInitialLoading: false,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isFetched: false,
        isFetchedAfterMount: false,
      } as unknown as ReturnType<typeof useTasksQuery>);

      renderHook(() => useRelatedTasksQuery(''), {
        wrapper: createWrapper(),
      });

      expect(mockUseTasksQuery).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          enabled: false,
        })
      );
    });

    it('respects custom staleTime option', () => {
      mockUseTasksQuery.mockReturnValue({
        data: { tasks: [] },
        isLoading: false,
        isError: false,
        error: null,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        fetchStatus: 'idle',
        status: 'success',
        isInitialLoading: false,
        isLoadingError: false,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isFetched: true,
        isFetchedAfterMount: true,
      } as unknown as ReturnType<typeof useTasksQuery>);

      renderHook(() => useRelatedTasksQuery('conv-123', { staleTime: 10000 }), {
        wrapper: createWrapper(),
      });

      expect(mockUseTasksQuery).toHaveBeenCalledWith(
        { conversation_id: 'conv-123' },
        expect.objectContaining({
          staleTime: 10000,
        })
      );
    });
  });

  describe('error handling', () => {
    it('handles fetch errors from useTasksQuery', () => {
      const errorMessage = 'Failed to fetch tasks: Network Error';
      mockUseTasksQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error(errorMessage),
        isSuccess: false,
        isFetching: false,
        refetch: vi.fn(),
        dataUpdatedAt: 0,
        errorUpdatedAt: Date.now(),
        failureCount: 1,
        failureReason: new Error(errorMessage),
        fetchStatus: 'idle',
        status: 'error',
        isInitialLoading: false,
        isLoadingError: true,
        isPaused: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: false,
        isFetched: true,
        isFetchedAfterMount: true,
      } as unknown as ReturnType<typeof useTasksQuery>);

      const { result } = renderHook(() => useRelatedTasksQuery('conv-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeInstanceOf(Error);
      expect((result.current.error as Error).message).toBe(errorMessage);
    });
  });
});
