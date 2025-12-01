import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConversationsPage } from '../ConversationsPage';
import type { Conversation } from '../../../types';
import React from 'react';

// Mock fetch globally for integration tests
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('ConversationsPage Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/conversations']}>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders multiple conversation items from API', async () => {
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
      {
        conversationId: 'conv-3',
        messages: [],
        createdAt: '2025-01-03T00:00:00Z',
        lastAccessedAt: '2025-01-03T00:00:00Z',
      },
    ];

    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({ conversations: mockConversations }),
    });

    renderWithProviders(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/conv-2/i)).toBeInTheDocument();
    expect(screen.getByText(/conv-3/i)).toBeInTheDocument();
  });

  it('filters conversations by status when status filter is applied', async () => {
    const user = userEvent.setup();
    const allConversations: Conversation[] = [
      {
        conversationId: 'conv-active-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
      {
        conversationId: 'conv-archived-1',
        messages: [],
        createdAt: '2025-01-02T00:00:00Z',
        lastAccessedAt: '2025-01-02T00:00:00Z',
      },
    ];

    // Initial load with all conversations
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({ conversations: allConversations }),
    });

    renderWithProviders(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/conv-active-1/i)).toBeInTheDocument();
    });

    // Apply status filter - this should trigger a new API call
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({
        conversations: [allConversations[0]], // Only active conversation
      }),
    });

    const statusSelect = screen.getByText('All Statuses')
      .parentElement as HTMLSelectElement;
    await user.selectOptions(statusSelect, 'active');

    // Wait for the filtered results
    await waitFor(() => {
      expect(screen.getByText(/conv-active-1/i)).toBeInTheDocument();
      expect(screen.queryByText(/conv-archived-1/i)).not.toBeInTheDocument();
    });

    // Verify the API was called with the status filter
    const fetchCalls = (mockFetch as ReturnType<typeof vi.fn>).mock.calls;
    const lastCall = fetchCalls[fetchCalls.length - 1];
    expect(lastCall[0]).toContain('status=active');
  });

  it('applies client-side search filter to conversations', async () => {
    const user = userEvent.setup();
    const mockConversations: Conversation[] = [
      {
        conversationId: 'test-conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
      {
        conversationId: 'other-conv-1',
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
      json: async () => ({ conversations: mockConversations }),
    });

    renderWithProviders(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/test-conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/other-conv-1/i)).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText(
      'Search conversations...'
    ) as HTMLInputElement;
    await user.type(searchInput, 'test');

    // Wait for filtered results (client-side filtering)
    await waitFor(() => {
      expect(screen.getByText(/test-conv-1/i)).toBeInTheDocument();
      expect(screen.queryByText(/other-conv-1/i)).not.toBeInTheDocument();
    });
  });

  it('handles pagination metadata from API response', async () => {
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

    const mockResponse = {
      conversations: mockConversations,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    };

    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => mockResponse,
    });

    renderWithProviders(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/conv-2/i)).toBeInTheDocument();
    });

    // Verify the API was called (pagination is handled by the API, not UI yet)
    expect(mockFetch).toHaveBeenCalled();
  });

  it('sorts conversations when sortBy filter is applied', async () => {
    const user = userEvent.setup();
    const mockConversations: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-05T00:00:00Z',
      },
      {
        conversationId: 'conv-2',
        messages: [],
        createdAt: '2025-01-02T00:00:00Z',
        lastAccessedAt: '2025-01-03T00:00:00Z',
      },
    ];

    // Initial load
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({ conversations: mockConversations }),
    });

    renderWithProviders(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    });

    // Apply sortBy filter
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({
        conversations: [...mockConversations].reverse(), // Sorted differently
      }),
    });

    const sortBySelect = screen.getByText('Sort by...')
      .parentElement as HTMLSelectElement;
    await user.selectOptions(sortBySelect, 'lastAccessedAt');

    // Verify API was called with sortBy parameter
    await waitFor(() => {
      const fetchCalls = (mockFetch as ReturnType<typeof vi.fn>).mock.calls;
      const lastCall = fetchCalls[fetchCalls.length - 1];
      expect(lastCall[0]).toContain('sortBy=lastAccessedAt');
    });
  });
});
