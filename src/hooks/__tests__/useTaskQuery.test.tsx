import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTaskQuery, taskQueryKeys } from '../useTaskQuery';
import { fetchTask } from '../../api/tasks';
import type { Task } from '../../types';

// Mock the fetchTask function
vi.mock('../../api/tasks', () => ({
  fetchTask: vi.fn(),
}));

const mockFetchTask = vi.mocked(fetchTask);

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

describe('useTaskQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('query keys', () => {
    it('generates correct query keys', () => {
      expect(taskQueryKeys.all).toEqual(['task']);
      expect(taskQueryKeys.detail(1)).toEqual(['task', 1]);
      expect(taskQueryKeys.detail(2)).toEqual(['task', 2]);
    });
  });

  describe('successful fetch', () => {
    it('fetches a task by ID', async () => {
      const mockTask: Task = {
        id: 1,
        prompt: 'Test task',
        status: 1,
        status_label: 'ready',
        createdat: '2025-01-01T00:00:00Z',
        updatedat: '2025-01-01T00:00:00Z',
        order: 1,
        uuid: 'uuid-1',
      };

      mockFetchTask.mockResolvedValueOnce(mockTask);

      const { result } = renderHook(() => useTaskQuery(1), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTask);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockFetchTask).toHaveBeenCalledWith(1);
    });

    it('uses different query keys for different task IDs', async () => {
      const mockTask1: Task = {
        id: 1,
        prompt: 'Test task 1',
        status: 1,
        status_label: 'ready',
        createdat: '2025-01-01T00:00:00Z',
        updatedat: '2025-01-01T00:00:00Z',
        order: 1,
        uuid: 'uuid-1',
      };

      const mockTask2: Task = {
        id: 2,
        prompt: 'Test task 2',
        status: 2,
        status_label: 'complete',
        createdat: '2025-01-02T00:00:00Z',
        updatedat: '2025-01-02T00:00:00Z',
        order: 2,
        uuid: 'uuid-2',
      };

      mockFetchTask
        .mockResolvedValueOnce(mockTask1)
        .mockResolvedValueOnce(mockTask2);

      const queryClient = createTestQueryClient();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result: result1 } = renderHook(() => useTaskQuery(1), {
        wrapper,
      });

      const { result: result2 } = renderHook(() => useTaskQuery(2), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Both queries should have different data cached
      expect(result1.current.data).toEqual(mockTask1);
      expect(result2.current.data).toEqual(mockTask2);
    });
  });

  describe('error handling', () => {
    it('handles fetch errors', async () => {
      const errorMessage = 'Task not found';
      mockFetchTask.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useTaskQuery(999), {
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
      const { result } = renderHook(() => useTaskQuery(1, { enabled: false }), {
        wrapper: createWrapper(),
      });

      // Query should not run when enabled is false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockFetchTask).not.toHaveBeenCalled();
    });

    it('disables query when taskId is invalid', async () => {
      const { result } = renderHook(() => useTaskQuery(0), {
        wrapper: createWrapper(),
      });

      // Query should not run when taskId is 0 or negative
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockFetchTask).not.toHaveBeenCalled();
    });

    it('respects custom staleTime option', async () => {
      const mockTask: Task = {
        id: 1,
        prompt: 'Test task',
        status: 1,
        status_label: 'ready',
        createdat: '2025-01-01T00:00:00Z',
        updatedat: '2025-01-01T00:00:00Z',
        order: 1,
        uuid: 'uuid-1',
      };

      mockFetchTask.mockResolvedValueOnce(mockTask);

      const { result } = renderHook(
        () => useTaskQuery(1, { staleTime: 10000 }),
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
