import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConversationDetailPage } from '../ConversationDetailPage';
import type { Conversation, Task } from '../../../types';
import React from 'react';

// Mock fetch globally for integration tests
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('ConversationDetailPage Integration Tests', () => {
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

  const renderWithProviders = (
    ui: React.ReactElement,
    initialEntries = ['/conversations/conv-1']
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/conversations/:conversationId" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders all sections (header, messages, related tasks) when navigating to /conversations/:id', async () => {
    const mockConversation: Conversation = {
      conversationId: 'conv-1',
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test message',
          timestamp: '2025-01-01T10:00:00Z',
        },
        {
          role: 'assistant',
          content: 'Hello! How can I help you?',
          timestamp: '2025-01-01T10:00:05Z',
        },
      ],
      createdAt: '2025-01-01T10:00:00Z',
      lastAccessedAt: '2025-01-01T10:00:05Z',
    };

    const mockRelatedTasks: Task[] = [
      {
        id: 1,
        prompt: 'Test task prompt',
        status: 0,
        status_label: 'ready',
        createdat: '2025-01-01T09:00:00Z',
        updatedat: '2025-01-01T09:00:00Z',
        order: 0,
        uuid: 'task-uuid-1',
      },
      {
        id: 2,
        prompt: 'Another test task',
        status: 1,
        status_label: 'complete',
        createdat: '2025-01-01T09:30:00Z',
        updatedat: '2025-01-01T10:00:00Z',
        order: 0,
        uuid: 'task-uuid-2',
      },
    ];

    // Mock fetch to handle both API calls based on URL
    (mockFetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      // Conversation API call
      if (url.includes('/conversations/api/conv-1')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => mockConversation,
        });
      }
      // Related tasks API call
      if (url.includes('/api/tasks') && url.includes('conversation_id=conv-1')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => ({ tasks: mockRelatedTasks }),
        });
      }
      // Default fallback
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithProviders(<ConversationDetailPage />, ['/conversations/conv-1']);

    // Wait for conversation to load and verify header section
    await waitFor(() => {
      expect(screen.getByTestId('conversation-header')).toBeInTheDocument();
    });

    // Verify header content
    expect(
      screen.getByText(/conversation id: conv-1/i)
    ).toBeInTheDocument();

    // Verify messages section
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();

    // Wait for related tasks to finish loading
    await waitFor(
      () => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        expect(screen.getByText('Test task prompt')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify related tasks content
    expect(screen.getByText('Related Tasks')).toBeInTheDocument();
    expect(screen.getByText('Test task prompt')).toBeInTheDocument();
    expect(screen.getByText('Another test task')).toBeInTheDocument();
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText('complete')).toBeInTheDocument();
  });

  it('navigates correctly via router to /conversations/:id with different conversation ID', async () => {
    const mockConversation: Conversation = {
      conversationId: 'conv-2',
      messages: [
        {
          role: 'user',
          content: 'Different conversation',
          timestamp: '2025-01-02T10:00:00Z',
        },
      ],
      createdAt: '2025-01-02T10:00:00Z',
      lastAccessedAt: '2025-01-02T10:00:00Z',
    };

    // Mock fetch to handle both API calls based on URL
    (mockFetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      // Conversation API call
      if (url.includes('/conversations/api/conv-2')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => mockConversation,
        });
      }
      // Related tasks API call (empty tasks)
      if (url.includes('/api/tasks') && url.includes('conversation_id=conv-2')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => ({ tasks: [] }),
        });
      }
      // Default fallback
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithProviders(<ConversationDetailPage />, ['/conversations/conv-2']);

    // Wait for conversation to load
    await waitFor(() => {
      expect(screen.getByTestId('conversation-header')).toBeInTheDocument();
    });

    // Verify the correct conversation ID is displayed
    expect(
      screen.getByText(/conversation id: conv-2/i)
    ).toBeInTheDocument();

    // Verify the API was called with the correct conversation ID
    const fetchCalls = (mockFetch as ReturnType<typeof vi.fn>).mock.calls;
    const conversationCall = fetchCalls.find((call) =>
      call[0].toString().includes('/conversations/api/conv-2')
    );
    expect(conversationCall).toBeDefined();
  });

  it('renders header section with conversation metadata', async () => {
    const mockConversation: Conversation = {
      conversationId: 'conv-3',
      messages: [],
      createdAt: '2025-01-03T08:00:00Z',
      lastAccessedAt: '2025-01-03T09:00:00Z',
    };

    // Mock fetch to handle both API calls based on URL
    (mockFetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      // Conversation API call
      if (url.includes('/conversations/api/conv-3')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => mockConversation,
        });
      }
      // Related tasks API call
      if (url.includes('/api/tasks') && url.includes('conversation_id=conv-3')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => ({ tasks: [] }),
        });
      }
      // Default fallback
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithProviders(<ConversationDetailPage />, ['/conversations/conv-3']);

    // Wait for header to render
    await waitFor(() => {
      expect(screen.getByTestId('conversation-header')).toBeInTheDocument();
    });

    // Verify header contains conversation ID
    expect(
      screen.getByText(/conversation id: conv-3/i)
    ).toBeInTheDocument();

    // Verify metadata labels are present
    expect(screen.getByText(/created:/i)).toBeInTheDocument();
    expect(screen.getByText(/last accessed:/i)).toBeInTheDocument();
  });

  it('renders messages section with all conversation messages', async () => {
    const mockConversation: Conversation = {
      conversationId: 'conv-4',
      messages: [
        {
          role: 'user',
          content: 'First user message',
          timestamp: '2025-01-04T10:00:00Z',
        },
        {
          role: 'assistant',
          content: 'First assistant response',
          timestamp: '2025-01-04T10:00:05Z',
        },
        {
          role: 'user',
          content: 'Second user message',
          timestamp: '2025-01-04T10:01:00Z',
        },
        {
          role: 'assistant',
          content: 'Second assistant response',
          timestamp: '2025-01-04T10:01:05Z',
        },
      ],
      createdAt: '2025-01-04T10:00:00Z',
      lastAccessedAt: '2025-01-04T10:01:05Z',
    };

    // Mock fetch to handle both API calls based on URL
    (mockFetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      // Conversation API call
      if (url.includes('/conversations/api/conv-4')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => mockConversation,
        });
      }
      // Related tasks API call
      if (url.includes('/api/tasks') && url.includes('conversation_id=conv-4')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => ({ tasks: [] }),
        });
      }
      // Default fallback
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithProviders(<ConversationDetailPage />, ['/conversations/conv-4']);

    // Wait for messages to render
    await waitFor(() => {
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
    });

    // Verify all messages are rendered
    expect(screen.getByText('First user message')).toBeInTheDocument();
    expect(screen.getByText('First assistant response')).toBeInTheDocument();
    expect(screen.getByText('Second user message')).toBeInTheDocument();
    expect(screen.getByText('Second assistant response')).toBeInTheDocument();
  });

  it('renders related tasks section with task list', async () => {
    const mockConversation: Conversation = {
      conversationId: 'conv-5',
      messages: [],
      createdAt: '2025-01-05T10:00:00Z',
      lastAccessedAt: '2025-01-05T10:00:00Z',
    };

    const mockRelatedTasks: Task[] = [
      {
        id: 10,
        prompt: 'Task 10 prompt',
        status: 0,
        status_label: 'ready',
        createdat: '2025-01-05T09:00:00Z',
        updatedat: '2025-01-05T09:00:00Z',
        order: 0,
        uuid: 'task-uuid-10',
      },
      {
        id: 11,
        prompt: 'Task 11 prompt',
        status: 1,
        status_label: 'complete',
        createdat: '2025-01-05T09:30:00Z',
        updatedat: '2025-01-05T10:00:00Z',
        order: 0,
        uuid: 'task-uuid-11',
      },
    ];

    // Mock fetch to handle both API calls based on URL
    (mockFetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      // Conversation API call
      if (url.includes('/conversations/api/conv-5')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => mockConversation,
        });
      }
      // Related tasks API call
      if (url.includes('/api/tasks') && url.includes('conversation_id=conv-5')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => ({ tasks: mockRelatedTasks }),
        });
      }
      // Default fallback
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithProviders(<ConversationDetailPage />, ['/conversations/conv-5']);

    // Wait for conversation to load first
    await waitFor(() => {
      expect(screen.getByTestId('conversation-header')).toBeInTheDocument();
    });

    // Wait for related tasks to finish loading (wait for loading spinner to disappear)
    await waitFor(
      () => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        expect(screen.getByText('Task 10 prompt')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify related tasks section title
    expect(screen.getByText('Related Tasks')).toBeInTheDocument();

    // Verify task items are rendered
    expect(screen.getByText('Task 10 prompt')).toBeInTheDocument();
    expect(screen.getByText('Task 11 prompt')).toBeInTheDocument();
    expect(screen.getByText('Task #10')).toBeInTheDocument();
    expect(screen.getByText('Task #11')).toBeInTheDocument();
    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(screen.getByText('complete')).toBeInTheDocument();

    // Verify task links are present
    expect(screen.getByTestId('related-task-10')).toBeInTheDocument();
    expect(screen.getByTestId('related-task-11')).toBeInTheDocument();
  });

  it('renders empty related tasks section when no tasks are found', async () => {
    const mockConversation: Conversation = {
      conversationId: 'conv-6',
      messages: [],
      createdAt: '2025-01-06T10:00:00Z',
      lastAccessedAt: '2025-01-06T10:00:00Z',
    };

    // Mock fetch to handle both API calls based on URL
    (mockFetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      // Conversation API call
      if (url.includes('/conversations/api/conv-6')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => mockConversation,
        });
      }
      // Related tasks API call with empty array
      if (url.includes('/api/tasks') && url.includes('conversation_id=conv-6')) {
        return Promise.resolve({
          ok: true,
          headers: {
            get: (name: string) =>
              name === 'content-type' ? 'application/json' : null,
          },
          json: async () => ({ tasks: [] }),
        });
      }
      // Default fallback
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderWithProviders(<ConversationDetailPage />, ['/conversations/conv-6']);

    // Wait for conversation to load first
    await waitFor(() => {
      expect(screen.getByTestId('conversation-header')).toBeInTheDocument();
    });

    // Wait for related tasks to finish loading and show empty state
    await waitFor(
      () => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        expect(screen.getByText('No related tasks found.')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify empty state message
    expect(screen.getByText('No related tasks found.')).toBeInTheDocument();
  });
});
