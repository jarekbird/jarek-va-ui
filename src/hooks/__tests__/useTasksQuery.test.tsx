import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTasksQuery, tasksQueryKeys } from '../useTasksQuery';
import { fetchTasks } from '../../api/tasks';
import type { Task } from '../../types';

// Mock the fetchTasks function
vi.mock('../../api/tasks', () => ({
  fetchTasks: vi.fn(),
}));

const mockFetchTasks = vi.mocked(fetchTasks);

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

describe('useTasksQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('query keys', () => {
    it('generates correct query keys', () => {
      expect(tasksQueryKeys.all).toEqual(['tasks']);
      expect(tasksQueryKeys.lists()).toEqual(['tasks', 'list']);
      expect(tasksQueryKeys.list()).toEqual(['tasks', 'list', undefined]);
      expect(tasksQueryKeys.list({ page: 1, limit: 10 })).toEqual([
        'tasks',
        'list',
        { page: 1, limit: 10 },
      ]);
      expect(tasksQueryKeys.list({ page: 2, limit: 20, status: 1 })).toEqual([
        'tasks',
        'list',
        { page: 2, limit: 20, status: 1 },
      ]);
    });
  });

  describe('successful fetch', () => {
    it('fetches tasks without params', async () => {
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

      mockFetchTasks.mockResolvedValueOnce({
        tasks: mockTasks,
      });

      const { result } = renderHook(() => useTasksQuery(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        tasks: mockTasks,
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFetchTasks).toHaveBeenCalledWith(undefined);
    });

    it('fetches tasks with filter/pagination params', async () => {
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
      ];

      const params = { page: 1, limit: 10, status: 1 };
      mockFetchTasks.mockResolvedValueOnce({
        tasks: mockTasks,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const { result } = renderHook(() => useTasksQuery(params), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        tasks: mockTasks,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      expect(mockFetchTasks).toHaveBeenCalledWith(params);
    });

    it('uses different query keys for different params', async () => {
      const mockTasks1: Task[] = [
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
      ];

      const mockTasks2: Task[] = [
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

      mockFetchTasks
        .mockResolvedValueOnce({
          tasks: mockTasks1,
        })
        .mockResolvedValueOnce({
          tasks: mockTasks2,
        });

      const queryClient = createTestQueryClient();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result: result1 } = renderHook(
        () => useTasksQuery({ page: 1, limit: 10 }),
        { wrapper }
      );

      const { result: result2 } = renderHook(
        () => useTasksQuery({ page: 2, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Both queries should have different data cached
      expect(result1.current.data?.tasks).toEqual(mockTasks1);
      expect(result2.current.data?.tasks).toEqual(mockTasks2);
    });
  });

  describe('error handling', () => {
    it('handles fetch errors', async () => {
      const errorMessage = 'Failed to fetch tasks: Network Error';
      mockFetchTasks.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useTasksQuery(), {
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
        () => useTasksQuery(undefined, { enabled: false }),
        {
          wrapper: createWrapper(),
        }
      );

      // Query should not run when enabled is false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockFetchTasks).not.toHaveBeenCalled();
    });

    it('respects custom staleTime option', async () => {
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
      ];

      mockFetchTasks.mockResolvedValueOnce({
        tasks: mockTasks,
      });

      const { result } = renderHook(
        () => useTasksQuery(undefined, { staleTime: 10000 }),
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
