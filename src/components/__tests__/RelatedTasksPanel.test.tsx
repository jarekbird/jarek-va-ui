import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { RelatedTasksPanel } from '../RelatedTasksPanel';
import { useRelatedTasksQuery } from '../../hooks/useRelatedTasksQuery';
import type { Task } from '../../types';

// Mock the useRelatedTasksQuery hook
vi.mock('../../hooks/useRelatedTasksQuery', () => ({
  useRelatedTasksQuery: vi.fn(),
}));

const mockUseRelatedTasksQuery = vi.mocked(useRelatedTasksQuery);

describe('RelatedTasksPanel', () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      prompt: 'Test task 1',
      status: 1,
      status_label: 'ready',
      createdat: '2025-01-01T12:00:00Z',
      updatedat: '2025-01-01T13:00:00Z',
      order: 0,
      uuid: null,
    },
    {
      id: 2,
      prompt: 'Test task 2',
      status: 2,
      status_label: 'complete',
      createdat: '2025-01-01T12:00:00Z',
      updatedat: '2025-01-01T13:00:00Z',
      order: 1,
      uuid: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseRelatedTasksQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isSuccess: false,
      isFetching: false,
      refetch: vi.fn(),
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      fetchStatus: 'fetching',
      status: 'pending',
      isInitialLoading: true,
      isLoadingError: false,
      isPaused: false,
      isPlaceholderData: false,
      isRefetchError: false,
      isRefetching: false,
      isStale: false,
      isFetched: false,
      isFetchedAfterMount: false,
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Related Tasks')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to load related tasks';
    mockUseRelatedTasksQuery.mockReturnValue({
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Related Tasks')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state when no tasks', () => {
    mockUseRelatedTasksQuery.mockReturnValue({
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Related Tasks')).toBeInTheDocument();
    expect(screen.getByText('No related tasks found.')).toBeInTheDocument();
  });

  it('renders list of tasks', () => {
    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: mockTasks },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Related Tasks')).toBeInTheDocument();
    expect(screen.getByText('Test task 1')).toBeInTheDocument();
    expect(screen.getByText('Test task 2')).toBeInTheDocument();
  });

  it('renders task links with correct hrefs', () => {
    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: mockTasks },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    const link1 = screen.getByTestId('related-task-1');
    const link2 = screen.getByTestId('related-task-2');

    expect(link1).toHaveAttribute('href', '/tasks/1');
    expect(link2).toHaveAttribute('href', '/tasks/2');
  });

  it('renders task IDs correctly', () => {
    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: mockTasks },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Task #1')).toBeInTheDocument();
    expect(screen.getByText('Task #2')).toBeInTheDocument();
  });

  it('renders task status labels correctly', () => {
    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: mockTasks },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    const readyStatus = screen.getByText('ready');
    const completeStatus = screen.getByText('complete');

    expect(readyStatus).toBeInTheDocument();
    expect(completeStatus).toBeInTheDocument();
    expect(readyStatus).toHaveClass('related-tasks-panel__status--ready');
    expect(completeStatus).toHaveClass('related-tasks-panel__status--complete');
  });

  it('renders task prompts', () => {
    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: mockTasks },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Test task 1')).toBeInTheDocument();
    expect(screen.getByText('Test task 2')).toBeInTheDocument();
  });

  it('calls useRelatedTasksQuery with correct conversationId', () => {
    mockUseRelatedTasksQuery.mockReturnValue({
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-456" />);

    expect(mockUseRelatedTasksQuery).toHaveBeenCalledWith('conv-456', {
      enabled: true,
    });
  });

  it('handles tasks with missing optional metadata (null createdat, updatedat, uuid)', () => {
    const tasksWithNullMetadata: Task[] = [
      {
        id: 1,
        prompt: 'Task with null metadata',
        status: 1,
        status_label: 'ready',
        createdat: null,
        updatedat: null,
        order: 0,
        uuid: null,
      },
    ];

    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: tasksWithNullMetadata },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Task with null metadata')).toBeInTheDocument();
    expect(screen.getByText('Task #1')).toBeInTheDocument();
  });

  it('handles tasks with empty prompt string', () => {
    const tasksWithEmptyPrompt: Task[] = [
      {
        id: 1,
        prompt: '',
        status: 1,
        status_label: 'ready',
        createdat: '2025-01-01T12:00:00Z',
        updatedat: '2025-01-01T13:00:00Z',
        order: 0,
        uuid: null,
      },
    ];

    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: tasksWithEmptyPrompt },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Task #1')).toBeInTheDocument();
    const promptElement = screen
      .getByTestId('related-task-1')
      .querySelector('.related-tasks-panel__task-prompt');
    expect(promptElement?.textContent).toBe('');
  });

  it('handles tasks with very long prompt text', () => {
    const longPrompt = 'A'.repeat(1000);
    const tasksWithLongPrompt: Task[] = [
      {
        id: 1,
        prompt: longPrompt,
        status: 1,
        status_label: 'ready',
        createdat: '2025-01-01T12:00:00Z',
        updatedat: '2025-01-01T13:00:00Z',
        order: 0,
        uuid: null,
      },
    ];

    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: tasksWithLongPrompt },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText(longPrompt)).toBeInTheDocument();
  });

  it('handles tasks with all status labels', () => {
    const tasksWithAllStatuses: Task[] = [
      {
        id: 1,
        prompt: 'Ready task',
        status: 0,
        status_label: 'ready',
        createdat: '2025-01-01T12:00:00Z',
        updatedat: '2025-01-01T13:00:00Z',
        order: 0,
        uuid: null,
      },
      {
        id: 2,
        prompt: 'Complete task',
        status: 1,
        status_label: 'complete',
        createdat: '2025-01-01T12:00:00Z',
        updatedat: '2025-01-01T13:00:00Z',
        order: 1,
        uuid: null,
      },
      {
        id: 3,
        prompt: 'Archived task',
        status: 2,
        status_label: 'archived',
        createdat: '2025-01-01T12:00:00Z',
        updatedat: '2025-01-01T13:00:00Z',
        order: 2,
        uuid: null,
      },
      {
        id: 4,
        prompt: 'Backlogged task',
        status: 3,
        status_label: 'backlogged',
        createdat: '2025-01-01T12:00:00Z',
        updatedat: '2025-01-01T13:00:00Z',
        order: 3,
        uuid: null,
      },
      {
        id: 5,
        prompt: 'Unknown task',
        status: 99,
        status_label: 'unknown',
        createdat: '2025-01-01T12:00:00Z',
        updatedat: '2025-01-01T13:00:00Z',
        order: 4,
        uuid: null,
      },
    ];

    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: tasksWithAllStatuses },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText('complete')).toBeInTheDocument();
    expect(screen.getByText('archived')).toBeInTheDocument();
    expect(screen.getByText('backlogged')).toBeInTheDocument();
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('handles large number of related tasks', () => {
    const manyTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      prompt: `Task ${i + 1}`,
      status: i % 4,
      status_label: ['ready', 'complete', 'archived', 'backlogged'][
        i % 4
      ] as Task['status_label'],
      createdat: '2025-01-01T12:00:00Z',
      updatedat: '2025-01-01T13:00:00Z',
      order: i,
      uuid: null,
    }));

    mockUseRelatedTasksQuery.mockReturnValue({
      data: { tasks: manyTasks },
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
    } as unknown as ReturnType<typeof useRelatedTasksQuery>);

    render(<RelatedTasksPanel conversationId="conv-123" />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 100')).toBeInTheDocument();
    expect(screen.getByTestId('related-task-1')).toBeInTheDocument();
    expect(screen.getByTestId('related-task-100')).toBeInTheDocument();
  });
});
