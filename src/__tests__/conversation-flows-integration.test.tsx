import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import type { Conversation } from '../types';

/**
 * Integration tests for Conversation Flows (Note-Taking)
 *
 * These tests verify the complete user journey from loading the conversation list,
 * creating a new conversation, navigating to detail view, updating the conversation,
 * and verifying UI updates.
 */

describe('Conversation Flows Integration', () => {
  // Track sent messages for polling simulation (shared across tests)
  const sentMessages = new Map<
    string,
    Array<{ role: string; content: string; timestamp: string }>
  >();

  const mockConversations: Conversation[] = [
    {
      conversationId: 'conv-1',
      messages: [
        {
          role: 'user',
          content: 'Message 1',
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          role: 'assistant',
          content: 'Response 1',
          timestamp: '2024-01-01T00:00:01Z',
        },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      lastAccessedAt: '2024-01-01T00:00:01Z',
    },
    {
      conversationId: 'conv-2',
      messages: [
        {
          role: 'user',
          content: 'Message 2',
          timestamp: '2024-01-02T00:00:00Z',
        },
        {
          role: 'assistant',
          content: 'Response 2',
          timestamp: '2024-01-02T00:00:01Z',
        },
      ],
      createdAt: '2024-01-02T00:00:00Z',
      lastAccessedAt: '2024-01-02T00:00:01Z',
    },
    {
      conversationId: 'conv-3',
      messages: [
        {
          role: 'user',
          content: 'Message 3',
          timestamp: '2024-01-03T00:00:00Z',
        },
      ],
      createdAt: '2024-01-03T00:00:00Z',
      lastAccessedAt: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    server.resetHandlers();
    // Clear sent messages for each test
    sentMessages.clear();

    // Set up default MSW handlers
    server.use(
      http.get(/\/conversations\/api\/list$/, () => {
        return HttpResponse.json(mockConversations, {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/api\/conversations\/list$/, () => {
        return HttpResponse.json(mockConversations, {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      // Handler for /conversations/api/:id (correct pattern)
      http.get(/\/conversations\/api\/(conv-\d+)$/, ({ params }) => {
        const conversationId = params[0] as string;
        const conversation = mockConversations.find(
          (c) => c.conversationId === conversationId
        );
        if (conversation) {
          // Start with base conversation messages
          const messages = [...conversation.messages];

          // Add any sent messages that aren't in the base conversation
          const sent = sentMessages.get(conversationId) || [];
          sent.forEach((sentMsg) => {
            if (
              !messages.some(
                (m) => m.content === sentMsg.content && m.role === sentMsg.role
              )
            ) {
              messages.push(sentMsg);
            }
          });

          // Simulate assistant response being added during polling
          // Check if last message is user without assistant response
          if (
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' &&
            (messages.length === 1 ||
              messages[messages.length - 2].role !== 'assistant')
          ) {
            // Add assistant response
            messages.push({
              role: 'assistant',
              content: `Response to: ${messages[messages.length - 1].content}`,
              timestamp: new Date().toISOString(),
            });
          }
          return HttpResponse.json(
            { ...conversation, messages },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        return HttpResponse.json(
          { error: 'Conversation not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      http.get(/\/api\/conversations\/(conv-\d+)$/, ({ params }) => {
        const conversationId = params[0] as string;
        const conversation = mockConversations.find(
          (c) => c.conversationId === conversationId
        );
        if (conversation) {
          // Start with base conversation messages
          const messages = [...conversation.messages];

          // Add any sent messages that aren't in the base conversation
          const sent = sentMessages.get(conversationId) || [];
          sent.forEach((sentMsg) => {
            if (
              !messages.some(
                (m) => m.content === sentMsg.content && m.role === sentMsg.role
              )
            ) {
              messages.push(sentMsg);
            }
          });

          // Simulate assistant response being added during polling
          // Check if last message is user without assistant response
          if (
            messages.length > 0 &&
            messages[messages.length - 1].role === 'user' &&
            (messages.length === 1 ||
              messages[messages.length - 2].role !== 'assistant')
          ) {
            // Add assistant response
            messages.push({
              role: 'assistant',
              content: `Response to: ${messages[messages.length - 1].content}`,
              timestamp: new Date().toISOString(),
            });
          }
          return HttpResponse.json(
            { ...conversation, messages },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        return HttpResponse.json(
          { error: 'Conversation not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      // Legacy handlers for /conversations/api/conversation/:id pattern (for backward compatibility)
      http.get(
        /\/conversations\/api\/conversation\/(conv-\d+)$/,
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
          return HttpResponse.json(
            { error: 'Conversation not found' },
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
      ),
      http.get(
        /\/api\/conversations\/conversation\/(conv-\d+)$/,
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
          return HttpResponse.json(
            { error: 'Conversation not found' },
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
      ),
      http.post(/\/conversations\/api\/new$/, () => {
        return HttpResponse.json(
          {
            success: true,
            conversationId: 'conv-new-1',
            queueType: 'api',
          },
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      http.post(/\/api\/conversations\/new$/, () => {
        return HttpResponse.json(
          {
            success: true,
            conversationId: 'conv-new-1',
            queueType: 'api',
          },
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      http.get(/\/conversations\/api\/conversation\/conv-new-1/, () => {
        return HttpResponse.json(
          {
            conversationId: 'conv-new-1',
            messages: [],
            createdAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }),
      http.get(/\/api\/conversations\/conversation\/conv-new-1/, () => {
        return HttpResponse.json(
          {
            conversationId: 'conv-new-1',
            messages: [],
            createdAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }),
      // Handler for POST /conversations/api/:id/message (correct pattern)
      http.post(
        /\/conversations\/api\/(conv-\d+)\/message$/,
        async ({ params, request }) => {
          const conversationId = params[0] as string;
          const body = (await request.json()) as { message: string };

          // Track the sent message for polling
          if (!sentMessages.has(conversationId)) {
            sentMessages.set(conversationId, []);
          }
          sentMessages.get(conversationId)!.push({
            role: 'user',
            content: body.message,
            timestamp: new Date().toISOString(),
          });

          return HttpResponse.json(
            {
              success: true,
              conversationId,
              message: 'Message sent',
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      ),
      http.post(
        /\/api\/conversations\/(conv-\d+)\/message$/,
        async ({ params, request }) => {
          const conversationId = params[0] as string;
          const body = (await request.json()) as { message: string };

          // Track the sent message for polling
          if (!sentMessages.has(conversationId)) {
            sentMessages.set(conversationId, []);
          }
          sentMessages.get(conversationId)!.push({
            role: 'user',
            content: body.message,
            timestamp: new Date().toISOString(),
          });

          return HttpResponse.json(
            {
              success: true,
              conversationId,
              message: 'Message sent',
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      ),
      // Legacy handlers for /conversations/api/conversation/:id/message pattern
      http.post(
        /\/conversations\/api\/conversation\/(conv-\d+)\/message/,
        () => {
          return HttpResponse.json(
            {
              conversationId: 'conv-1',
              messages: [
                ...mockConversations[0].messages,
                {
                  role: 'user',
                  content: 'New message',
                  timestamp: new Date().toISOString(),
                },
              ],
              createdAt: '2024-01-01T00:00:00Z',
              lastAccessedAt: new Date().toISOString(),
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      ),
      http.post(
        /\/api\/conversations\/conversation\/(conv-\d+)\/message/,
        () => {
          return HttpResponse.json(
            {
              conversationId: 'conv-1',
              messages: [
                ...mockConversations[0].messages,
                {
                  role: 'user',
                  content: 'New message',
                  timestamp: new Date().toISOString(),
                },
              ],
              createdAt: '2024-01-01T00:00:00Z',
              lastAccessedAt: new Date().toISOString(),
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      )
    );
  });

  it('conversation list loads and displays conversations', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
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

    // Verify conversations are displayed (by ID)
    expect(screen.getByText(/ID: conv-1/i)).toBeInTheDocument();
    expect(screen.getByText(/ID: conv-2/i)).toBeInTheDocument();
    expect(screen.getByText(/ID: conv-3/i)).toBeInTheDocument();
  });

  it('creating a new conversation works correctly', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
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

    // Find and click the "New Note" button
    const newNoteButton = screen.getByRole('button', { name: /\+ new note/i });
    await user.click(newNoteButton);

    // Wait for navigation to new conversation
    await waitFor(
      () => {
        // Should navigate to the new conversation detail view
        // Link should be found by text
        const backLink = screen.queryByText(/back to note taking history/i);
        expect(backLink).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('navigation to conversation detail works', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
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

    // Find and click on the first conversation (by ID)
    const conversationLink = screen.getByRole('link', {
      name: /ID: conv-1/i,
    });
    await user.click(conversationLink);

    // Wait for navigation to detail view and conversation to load
    await waitFor(
      () => {
        // First check if conversation loaded
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        expect(
          screen.getByText(/Note Session ID: conv-1/i)
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Now verify back link is present (should be at least one, possibly two)
    const backLinks = screen.getAllByText(/back to note taking history/i);
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('conversation detail displays correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/conversation/conv-1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for conversation to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify conversation details are displayed (by ID)
    expect(screen.getByText(/Note Session ID: conv-1/i)).toBeInTheDocument();
  });

  it('updating conversation works correctly by sending a message', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/conversation/conv-1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for conversation to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find the message input and send a message
    const messageInput = screen.getByPlaceholderText(/type your message/i);
    expect(messageInput).toBeInTheDocument();

    // Type a message
    await user.type(messageInput, 'New message');

    // Find and click the send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    // Wait for message to be sent
    await waitFor(
      () => {
        // The message should appear in the conversation
        expect(screen.getByText('New message')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('UI updates reflect changes after sending a message', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/conversation/conv-1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for conversation to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Send a message
    const messageInput = screen.getByPlaceholderText(/type your message/i);
    await user.type(messageInput, 'New message');

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    // Wait for message to be sent and appear in UI
    // The message is added optimistically, so it should appear immediately
    await waitFor(
      () => {
        expect(screen.getByText('New message')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Navigate back to list (link at bottom)
    // There should be two links - one at top and one at bottom
    const backLinks = screen.getAllByText(/back to note taking history/i);
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    // Click the last one (bottom link)
    await user.click(backLinks[backLinks.length - 1]);

    // Wait for list to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // The conversation should still be in the list
    expect(screen.getByText(/ID: conv-1/i)).toBeInTheDocument();
  });

  it('error paths are handled gracefully when conversation not found', async () => {
    server.use(
      http.get(/\/conversations\/api\/conversation\/conv-999/, () => {
        return HttpResponse.json(
          { error: 'Conversation not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      http.get(/\/api\/conversations\/conversation\/conv-999/, () => {
        return HttpResponse.json(
          { error: 'Conversation not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    render(
      <MemoryRouter initialEntries={['/conversation/conv-999']}>
        <App />
      </MemoryRouter>
    );

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Error message should be displayed
    await waitFor(
      () => {
        // The error message from the API client
        expect(
          screen.getByText(/conversation not found|note session not found/i)
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('error paths are handled gracefully when list fails to load', async () => {
    server.use(
      http.get(/\/conversations\/api\/list$/, () => {
        return HttpResponse.json(
          { error: 'Network error' },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      http.get(/\/api\/conversations\/list$/, () => {
        return HttpResponse.json(
          { error: 'Network error' },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Wait for error to be displayed
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Error message should be displayed
    await waitFor(
      () => {
        expect(
          screen.getByText(/network error|server error/i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
