import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { ConversationsPage } from '../ConversationsPage';
import * as conversationsAPI from '../../../api/conversations';
import * as useConversationsQueryHook from '../../../hooks/useConversationsQuery';
import type { Conversation } from '../../../types';
import type { FetchConversationsResponse } from '../../../api/conversations';
import React from 'react';

// Mock the API module
vi.mock('../../../api/conversations');

// Mock the query hook
vi.mock('../../../hooks/useConversationsQuery');

describe('ConversationsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/conversations']}>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders loading state when query is loading', () => {
    vi.mocked(useConversationsQueryHook.useConversationsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    renderWithProviders(<ConversationsPage />);

    expect(screen.getByText('Conversation History')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /new conversation/i })
    ).toBeInTheDocument();
  });

  it('renders error state when query fails', async () => {
    const errorMessage = 'Failed to fetch conversations';
    vi.mocked(useConversationsQueryHook.useConversationsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error(errorMessage),
      refetch: vi.fn(),
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    renderWithProviders(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('renders empty state when no conversations are found', async () => {
    vi.mocked(useConversationsQueryHook.useConversationsQuery).mockReturnValue({
      data: { conversations: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    renderWithProviders(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No conversations found/i)).toBeInTheDocument();
    });
  });

  it('renders success state with conversations list', async () => {
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

    vi.mocked(useConversationsQueryHook.useConversationsQuery).mockReturnValue({
      data: { conversations: mockConversations },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    renderWithProviders(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/conv-2/i)).toBeInTheDocument();
    });
  });

  it('handles new conversation creation', async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();
    const mockConversations: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
    ];

    vi.mocked(useConversationsQueryHook.useConversationsQuery).mockReturnValue({
      data: { conversations: mockConversations },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    vi.mocked(conversationsAPI.createConversation).mockResolvedValue({
      success: true,
      conversationId: 'conv-new',
    });

    renderWithProviders(<ConversationsPage />);

    const newButton = screen.getByRole('button', { name: /new conversation/i });
    await user.click(newButton);

    await waitFor(() => {
      expect(conversationsAPI.createConversation).toHaveBeenCalledWith({
        queueType: 'api',
      });
    });
  });

  it('displays error when conversation creation fails', async () => {
    const user = userEvent.setup();
    const mockConversations: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
    ];

    vi.mocked(useConversationsQueryHook.useConversationsQuery).mockReturnValue({
      data: { conversations: mockConversations },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    vi.mocked(conversationsAPI.createConversation).mockResolvedValue({
      success: false,
    });

    renderWithProviders(<ConversationsPage />);

    const newButton = screen.getByRole('button', { name: /new conversation/i });
    await user.click(newButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to create conversation')
      ).toBeInTheDocument();
    });
  });

  it('highlights active conversation from URL', async () => {
    const mockConversations: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
    ];

    vi.mocked(useConversationsQueryHook.useConversationsQuery).mockReturnValue({
      data: { conversations: mockConversations },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/conversations/conv-1']}>
          <ConversationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    });
  });

  it('initializes filters from URL search params', async () => {
    const mockConversations: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
    ];

    const mockUseQuery = vi.mocked(
      useConversationsQueryHook.useConversationsQuery
    );

    mockUseQuery.mockReturnValue({
      data: { conversations: mockConversations },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={['/conversations?status=active&sortBy=createdAt']}
        >
          <ConversationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Verify that useConversationsQuery was called with filters from URL
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          sortBy: 'createdAt',
        })
      );
    });
  });

  it('updates URL search params when filters change', async () => {
    const user = userEvent.setup();
    const mockConversations: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
    ];

    const mockUseQuery = vi.mocked(
      useConversationsQueryHook.useConversationsQuery
    );

    mockUseQuery.mockReturnValue({
      data: { conversations: mockConversations },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<FetchConversationsResponse, Error>);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/conversations']}>
          <ConversationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search conversations...')
      ).toBeInTheDocument();
    });

    // Change status filter
    const statusSelect = screen.getByText('All Statuses')
      .parentElement as HTMLSelectElement;
    await user.selectOptions(statusSelect, 'active');

    // Verify URL was updated (we can't directly check URL in MemoryRouter,
    // but we can verify the query was called with the new filter)
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });
  });

  it('refetches query when filters change', async () => {
    const user = userEvent.setup();
    const mockConversations: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
    ];

    const mockUseQuery = vi.mocked(
      useConversationsQueryHook.useConversationsQuery
    );

    // Track call count
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      callCount++;
      return {
        data: { conversations: mockConversations },
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as UseQueryResult<FetchConversationsResponse, Error>;
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/conversations']}>
          <ConversationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search conversations...')
      ).toBeInTheDocument();
    });

    const initialCallCount = callCount;

    // Change sort by filter
    const sortBySelect = screen.getByText('Sort by...')
      .parentElement as HTMLSelectElement;
    await user.selectOptions(sortBySelect, 'createdAt');

    // Verify query was called again with new params
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(initialCallCount);
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'createdAt',
        })
      );
    });
  });
});
