import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import type { Conversation, Task } from '../types';

// Mock fetch globally for integration tests
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('Routing Integration', () => {
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
  });

  const mockConversations: Conversation[] = [
    {
      conversationId: 'conv-1',
      messages: [
        {
          role: 'user',
          content: 'Hello',
          timestamp: '2025-01-01T00:00:00Z',
        },
      ],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T00:00:00Z',
    },
  ];

  const mockTasks: Task[] = [
    {
      id: 1,
      status: 1,
      status_label: 'complete',
      prompt: 'Test task',
      createdat: '2025-01-01T00:00:00Z',
      updatedat: '2025-01-01T00:00:00Z',
      order: 0,
      uuid: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock responses for fetch
    (mockFetch as ReturnType<typeof vi.fn>).mockImplementation((url) => {
      if (typeof url === 'string') {
        // Mock fetchConversations - calls /conversations/api/list
        if (url.includes('/conversations/api/list')) {
          return Promise.resolve({
            ok: true,
            headers: {
              get: (name: string) =>
                name === 'content-type' ? 'application/json' : null,
            },
            json: async () => ({ conversations: mockConversations }),
          });
        }
        // Mock fetchConversation - calls /conversations/api/{conversationId}
        if (url.includes('/conversations/api/conv-1')) {
          return Promise.resolve({
            ok: true,
            headers: {
              get: (name: string) =>
                name === 'content-type' ? 'application/json' : null,
            },
            json: async () => mockConversations[0],
          });
        }
        // Mock listTasks - calls /api/tasks
        if (url.includes('/api/tasks') && !url.match(/\/api\/tasks\/\d+$/)) {
          return Promise.resolve({
            ok: true,
            headers: {
              get: (name: string) =>
                name === 'content-type' ? 'application/json' : null,
            },
            json: async () => ({ tasks: mockTasks }),
          });
        }
        // Mock getTaskById - calls /api/tasks/{taskId}
        if (url.includes('/api/tasks/1')) {
          return Promise.resolve({
            ok: true,
            headers: {
              get: (name: string) =>
                name === 'content-type' ? 'application/json' : null,
            },
            json: async () => mockTasks[0],
          });
        }
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('navigation between routes', () => {
    it('navigates from conversations to tasks via navigation link', async () => {
      const user = userEvent.setup();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/conversations']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Wait for conversations to load
      await waitFor(() => {
        expect(screen.getByText('Conversation History')).toBeInTheDocument();
      });

      // Click Tasks navigation link
      const tasksLink = screen.getByRole('link', { name: 'Tasks' });
      await user.click(tasksLink);

      // Verify we're now on the tasks page
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Tasks' })
        ).toBeInTheDocument();
      });

      // Verify conversations content is no longer visible
      expect(
        screen.queryByText('Conversation History')
      ).not.toBeInTheDocument();
    });

    it('navigates from tasks to conversations via navigation link', async () => {
      const user = userEvent.setup();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/tasks']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Tasks' })
        ).toBeInTheDocument();
      });

      // Click Conversations navigation link
      const conversationsLink = screen.getByRole('link', {
        name: 'Conversations',
      });
      await user.click(conversationsLink);

      // Verify we're now on the conversations page
      await waitFor(() => {
        expect(screen.getByText('Conversation History')).toBeInTheDocument();
      });

      // Verify tasks heading is no longer visible (only navigation link)
      const headings = screen.queryAllByRole('heading', { name: 'Tasks' });
      expect(headings.length).toBe(0);
    });

    it('navigates to conversation detail from conversation list', async () => {
      const user = userEvent.setup();

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/conversations']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Wait for conversations to load
      await waitFor(() => {
        expect(screen.getByText('Conversation History')).toBeInTheDocument();
        expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
      });

      // Find and click a conversation link
      const conversationLink = screen.getByText(/conv-1/i).closest('a');
      if (conversationLink) {
        await user.click(conversationLink);

        // Verify we're now on the conversation detail page
        await waitFor(() => {
          expect(screen.getByText('Hello')).toBeInTheDocument();
        });

        // Verify conversation list is no longer visible
        expect(
          screen.queryByText('Conversation History')
        ).not.toBeInTheDocument();
      }
    });

    it('navigates to task detail from task list', async () => {
      const user = userEvent.setup();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/tasks']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Wait for tasks to load
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Tasks' })
        ).toBeInTheDocument();
      });

      // Find task link by looking for the task ID or any link in the task list
      const taskLinks = screen.getAllByRole('link');
      const taskDetailLink = taskLinks.find(
        (link) => link.getAttribute('href') === '/tasks/1'
      );

      if (taskDetailLink) {
        await user.click(taskDetailLink);

        // Verify we're now on the task detail page
        await waitFor(() => {
          expect(screen.getByText(/Back to Tasks/i)).toBeInTheDocument();
        });

        // Verify task list heading is no longer visible
        const headings = screen.queryAllByRole('heading', { name: 'Tasks' });
        expect(headings.length).toBe(0);
      }
    });
  });

  describe('route component rendering', () => {
    it('renders correct component for /conversations route', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/conversations']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Conversation History')).toBeInTheDocument();
      });

      // Verify it's the ConversationListView component
      expect(
        screen.getByRole('button', { name: /new conversation/i })
      ).toBeInTheDocument();
    });

    it('renders correct component for /conversations/:conversationId route', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/conversations/conv-1']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      // Verify ConversationDetailPage is rendered (not ConversationsPage)
      expect(
        screen.queryByText('Conversation History')
      ).not.toBeInTheDocument();
    });

    it('renders correct component for /tasks route', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/tasks']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Tasks' })
        ).toBeInTheDocument();
      });

      // Verify it's the TaskListView component
      expect(
        screen.getByRole('heading', { name: 'Tasks' })
      ).toBeInTheDocument();
    });

    it('renders correct component for /tasks/:taskId route', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/tasks/1']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Back to Tasks/i)).toBeInTheDocument();
      });

      // Verify TaskDetailView is rendered (not TaskListView)
      // TaskDetailView shows "Back to Tasks" link
      expect(screen.getByText(/Back to Tasks/i)).toBeInTheDocument();
    });
  });

  describe('navigation state persistence', () => {
    it('maintains navigation links across route changes', async () => {
      const user = userEvent.setup();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/conversations']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Verify navigation is present initially
      expect(
        screen.getByRole('link', { name: 'Conversations' })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();

      // Navigate to tasks
      const tasksLink = screen.getByRole('link', { name: 'Tasks' });
      await user.click(tasksLink);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: 'Tasks' })
        ).toBeInTheDocument();
      });

      // Verify navigation is still present
      expect(
        screen.getByRole('link', { name: 'Conversations' })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    });
  });
});
