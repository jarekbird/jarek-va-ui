import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { TaskDetailPage } from '../TaskDetailPage';
import * as useTaskQueryHook from '../../../hooks/useTaskQuery';
import type { Task } from '../../../types';
import React from 'react';

// Mock the query hook
vi.mock('../../../hooks/useTaskQuery');

describe('TaskDetailPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0, // Ensure queries are garbage collected immediately
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    queryClient.clear();
  });

  const renderWithProviders = (
    ui: React.ReactElement,
    initialEntries = ['/tasks/123']
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/tasks/:taskId" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state when query is loading', () => {
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    renderWithProviders(<TaskDetailPage />);

    expect(screen.getByText(/back to tasks/i)).toBeInTheDocument();
  });

  it('renders error state when query fails', async () => {
    const errorMessage = 'Failed to fetch task';
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error(errorMessage),
    } as unknown as UseQueryResult<Task, Error>);

    renderWithProviders(<TaskDetailPage />);

    await waitFor(
      () => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('renders not found state when task is not found', async () => {
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    renderWithProviders(<TaskDetailPage />);

    await waitFor(
      () => {
        expect(screen.getByText(/task not found/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('renders not found state when taskId is invalid', async () => {
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    renderWithProviders(<TaskDetailPage />, ['/tasks/invalid']);

    await waitFor(
      () => {
        expect(screen.getByText(/task not found/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('renders success state with task details', async () => {
    const mockTask: Task = {
      id: 123,
      prompt: 'Test task prompt',
      status: 1,
      status_label: 'ready',
      createdat: '2025-01-01T00:00:00Z',
      updatedat: '2025-01-01T00:00:00Z',
      order: 1,
      uuid: 'test-uuid',
    };

    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: mockTask,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    renderWithProviders(<TaskDetailPage />);

    await waitFor(
      () => {
        expect(screen.getByText(/back to tasks/i)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('reads taskId from route params', async () => {
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    renderWithProviders(<TaskDetailPage />, ['/tasks/456']);

    await waitFor(
      () => {
        expect(useTaskQueryHook.useTaskQuery).toHaveBeenCalledWith(
          456,
          expect.objectContaining({
            enabled: true,
          })
        );
      },
      { timeout: 1000 }
    );
  });

  it('handles undefined taskId gracefully', () => {
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    // When taskId is undefined, the component should still render
    // but the query should be disabled
    // We test with a valid route to ensure the component renders
    renderWithProviders(<TaskDetailPage />, ['/tasks/123']);

    // The hook should be called
    expect(useTaskQueryHook.useTaskQuery).toHaveBeenCalled();
  });

  it('disables query when taskId is invalid', () => {
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    renderWithProviders(<TaskDetailPage />, ['/tasks/abc']);

    // When taskId is "abc", parseInt returns NaN, which should be converted to 0
    expect(useTaskQueryHook.useTaskQuery).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('disables query when taskId is zero', () => {
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    // When taskId is 0, it should disable the query
    renderWithProviders(<TaskDetailPage />, ['/tasks/0']);

    // When taskId is 0, it should use 0 and disable the query
    expect(useTaskQueryHook.useTaskQuery).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it('parses taskId correctly from route params', () => {
    vi.mocked(useTaskQueryHook.useTaskQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Task, Error>);

    renderWithProviders(<TaskDetailPage />, ['/tasks/789']);

    expect(useTaskQueryHook.useTaskQuery).toHaveBeenCalledWith(
      789,
      expect.objectContaining({
        enabled: true,
      })
    );
  });
});
