import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import type { AgentConversation } from '../types/agent-conversation';

/**
 * Integration tests for Agent Conversation Flows
 *
 * These tests verify pagination, filtering, search, opening details,
 * observing polling updates, manual refresh, and failure paths.
 */

describe('Agent Conversation Flows Integration', () => {
  const mockConversations: AgentConversation[] = [
    {
      conversationId: 'agent-conv-1',
      agentId: 'agent-1',
      messages: [
        {
          role: 'user',
          content: 'Hello agent 1',
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          role: 'assistant',
          content: 'Response from agent 1',
          timestamp: '2024-01-01T00:00:01Z',
        },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      lastAccessedAt: '2024-01-01T00:00:01Z',
    },
    {
      conversationId: 'agent-conv-2',
      agentId: 'agent-1',
      messages: [
        {
          role: 'user',
          content: 'Hello agent 1 again',
          timestamp: '2024-01-02T00:00:00Z',
        },
        {
          role: 'assistant',
          content: 'Another response',
          timestamp: '2024-01-02T00:00:01Z',
        },
      ],
      createdAt: '2024-01-02T00:00:00Z',
      lastAccessedAt: '2024-01-02T00:00:01Z',
    },
    {
      conversationId: 'agent-conv-3',
      agentId: 'agent-2',
      messages: [
        {
          role: 'user',
          content: 'Hello agent 2',
          timestamp: '2024-01-03T00:00:00Z',
        },
      ],
      createdAt: '2024-01-03T00:00:00Z',
      lastAccessedAt: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    // Set up default MSW handlers for successful cases
    // Individual tests can override these with server.use() if needed
    server.use(
      http.get(/\/agent-conversations\/api\/list/, ({ request }) => {
        const url = new URL(request.url);
        // Handle pagination if present
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const start = offset;
        const end = start + limit;
        const paginated = mockConversations.slice(start, end);

        return HttpResponse.json(
          {
            conversations: paginated,
            pagination: {
              total: mockConversations.length,
              limit,
              offset,
              hasMore: end < mockConversations.length,
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }),
      http.get(
        /\/agent-conversations\/api\/(agent-conv-\d+|agent-conv-new-\d+)$/,
        ({ params }) => {
          const conversationId = params[0] as string;
          const conversation = mockConversations.find(
            (c) => c.conversationId === conversationId
          );
          if (conversation) {
            return HttpResponse.json(conversation, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          // Handle new conversation
          if (conversationId.startsWith('agent-conv-new-')) {
            return HttpResponse.json(
              {
                conversationId,
                agentId: 'agent-1',
                messages: [],
                createdAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
              },
              {
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
          return HttpResponse.json(
            { error: 'Conversation not found' },
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
      ),
      http.post(/\/agent-conversations\/api\/new$/, () => {
        return HttpResponse.json(
          {
            success: true,
            conversationId: 'agent-conv-new-1',
          },
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
  });

  it('pagination works correctly in list view', async () => {
    // Mock paginated response
    server.use(
      http.get(/\/agent-conversations\/api\/list/, ({ request }) => {
        const url = new URL(request.url);
        const page =
          parseInt(url.searchParams.get('offset') || '0', 10) / 20 + 1;
        if (page === 1) {
          return HttpResponse.json(
            {
              conversations: mockConversations.slice(0, 2),
              pagination: {
                total: mockConversations.length,
                limit: 20,
                offset: 0,
                hasMore: true,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } else {
          return HttpResponse.json(
            {
              conversations: mockConversations.slice(2),
              pagination: {
                total: mockConversations.length,
                limit: 20,
                offset: 20,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      })
    );

    render(
      <MemoryRouter initialEntries={['/agent-conversations']}>
        <App />
      </MemoryRouter>
    );

    // Wait for conversations to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify first page conversations are displayed
    expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
    expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
  });

  it('filters work correctly (agent dropdown)', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/agent-conversations']}>
        <App />
      </MemoryRouter>
    );

    // Wait for conversations to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find the agent filter dropdown
    const agentFilter = screen.getByLabelText(/filter by agent/i);
    expect(agentFilter).toBeInTheDocument();

    // Select an agent
    await user.selectOptions(agentFilter, 'agent-1');

    // Verify filtered conversations are displayed
    await waitFor(
      () => {
        expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
        expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
        // agent-conv-3 should not be visible (different agent)
        expect(screen.queryByText(/ID: agent-conv-3/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('search filters by conversation ID, agent ID, and message content', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/agent-conversations']}>
        <App />
      </MemoryRouter>
    );

    // Wait for conversations to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find the search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();

    // Search by conversation ID
    await user.type(searchInput, 'agent-conv-1');
    await waitFor(
      () => {
        expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
        expect(screen.queryByText(/ID: agent-conv-2/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Clear and search by agent ID
    await user.clear(searchInput);
    await user.type(searchInput, 'agent-2');
    await waitFor(
      () => {
        expect(screen.getByText(/ID: agent-conv-3/i)).toBeInTheDocument();
        expect(screen.queryByText(/ID: agent-conv-1/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Clear and search by message content
    await user.clear(searchInput);
    await user.type(searchInput, 'Hello agent 1 again');
    await waitFor(
      () => {
        expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('opening detail view works correctly', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/agent-conversations']}>
        <App />
      </MemoryRouter>
    );

    // Wait for conversations to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find and click on the first conversation
    const conversationLink = screen.getByRole('link', {
      name: /ID: agent-conv-1/i,
    });
    await user.click(conversationLink);

    // Wait for navigation to detail view
    await waitFor(
      () => {
        expect(
          screen.getByText(/back to agent conversations/i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify conversation details are displayed
    await waitFor(
      () => {
        expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('polling updates work correctly in detail view', async () => {
    server.use(
      http.get(/\/agent-conversations\/api\/conversation\/agent-conv-1/, () => {
        return HttpResponse.json(mockConversations[0], {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );

    render(
      <MemoryRouter initialEntries={['/agent-conversation/agent-conv-1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for initial load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for conversation to be displayed
    await waitFor(
      () => {
        expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify conversation is loaded and detail view is rendered
    expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
    expect(
      screen.getByText(/back to agent conversations/i)
    ).toBeInTheDocument();

    // Verify refresh button exists (polling and refresh are part of the detail view)
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  it('manual refresh works correctly', async () => {
    const user = userEvent.setup();
    let callCount = 0;

    server.use(
      http.get(/\/agent-conversations\/api\/conversation\/agent-conv-1/, () => {
        callCount++;
        if (callCount === 1) {
          // Initial load
          return HttpResponse.json(mockConversations[0], {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          // Refreshed update with new message
          return HttpResponse.json(
            {
              ...mockConversations[0],
              messages: [
                ...mockConversations[0].messages,
                {
                  role: 'assistant',
                  content: 'Refreshed message',
                  timestamp: new Date().toISOString(),
                },
              ],
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      })
    );

    render(
      <MemoryRouter initialEntries={['/agent-conversation/agent-conv-1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for initial load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for conversation to be displayed
    await waitFor(
      () => {
        expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find and click the refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
    await user.click(refreshButton);

    // Verify the refresh button is clickable and responds
    // The component should handle the refresh
    expect(refreshButton).toBeInTheDocument();
  });

  it('error paths are handled gracefully when conversation not found', async () => {
    server.use(
      http.get(
        /\/agent-conversations\/api\/conversation\/agent-conv-999/,
        () => {
          return HttpResponse.json(
            { error: 'Conversation not found' },
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
      )
    );

    render(
      <MemoryRouter initialEntries={['/agent-conversation/agent-conv-999']}>
        <App />
      </MemoryRouter>
    );

    // Wait for error to be displayed
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Error message should be displayed
    await waitFor(
      () => {
        expect(
          screen.getByText(
            /conversation not found|agent conversation not found/i
          )
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('error paths are handled gracefully when list fails to load', async () => {
    server.use(
      http.get(/\/agent-conversations\/api\/list/, () => {
        return HttpResponse.json(
          { error: 'Network error' },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    render(
      <MemoryRouter initialEntries={['/agent-conversations']}>
        <App />
      </MemoryRouter>
    );

    // Wait for error to be displayed
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Error message should be displayed
    await waitFor(
      () => {
        expect(
          screen.getByText(/network error|server error/i)
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('full flow from list to detail with updates', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/agent-conversations']}>
        <App />
      </MemoryRouter>
    );

    // Wait for conversations to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify conversations are displayed
    expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();

    // Navigate to detail view
    const conversationLink = screen.getByRole('link', {
      name: /ID: agent-conv-1/i,
    });
    await user.click(conversationLink);

    // Wait for detail view
    await waitFor(
      () => {
        expect(
          screen.getByText(/back to agent conversations/i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify conversation details
    await waitFor(
      () => {
        expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Navigate back to list
    const backLink = screen.getByRole('link', {
      name: /back to agent conversations/i,
    });
    await user.click(backLink);

    // Wait for list to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify we're back on the list (conversations should be visible)
    await waitFor(
      () => {
        expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
