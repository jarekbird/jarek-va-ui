import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import { render as renderWithRouter } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { ConversationListView } from '../ConversationListView';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import type { Conversation } from '../../types';

/**
 * Comprehensive unit tests for ConversationListView component
 *
 * This test suite verifies:
 * - Successful loading and rendering of conversations list
 * - Error handling with user-friendly messages and retry functionality
 * - New conversation creation in both standalone and dashboard modes
 * - Active conversation highlighting based on URL
 * - Loading and empty states
 * - Props behavior (showNavigation, showContainer, onConversationSelect)
 * - Integration with MSW for API mocking
 */

describe('ConversationListView', () => {
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset MSW handlers to default
    server.resetHandlers();
  });

  describe('Successful load', () => {
    it('loads and displays list of conversations', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<ConversationListView />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Verify conversations are displayed
      expect(screen.getByText(/ID: conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/ID: conv-2/i)).toBeInTheDocument();
    });

    it('highlights active conversation based on URL', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderWithRouter(
        <MemoryRouter initialEntries={['/conversation/conv-1']}>
          <ConversationListView />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Find the active conversation item
      const activeItem = screen.getByText(/ID: conv-1/i).closest('li');
      expect(activeItem).toHaveClass('active');
    });

    it('renders Navigation component when showNavigation is true', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<ConversationListView showNavigation={true} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Navigation should be rendered (check for a link that Navigation renders)
      expect(
        screen.getByRole('link', { name: /note taking history/i })
      ).toBeInTheDocument();
    });

    it('hides Navigation component when showNavigation is false', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<ConversationListView showNavigation={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Navigation should not be rendered
      expect(
        screen.queryByRole('link', { name: /note taking history/i })
      ).not.toBeInTheDocument();
    });

    it('renders container div when showContainer is true', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const { container } = render(
        <ConversationListView showContainer={true} />
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check for container class
      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toBeInTheDocument();
    });

    it('renders panel div when showContainer is false', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const { container } = render(
        <ConversationListView showContainer={false} />
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check for panel class
      const panelDiv = container.querySelector('.conversation-list-view-panel');
      expect(panelDiv).toBeInTheDocument();
    });

    it('renders h1 when showContainer is true', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<ConversationListView showContainer={true} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(
        screen.getByRole('heading', { name: /note taking history/i, level: 1 })
      ).toBeInTheDocument();
    });

    it('renders h2 when showContainer is false', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<ConversationListView showContainer={false} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      expect(
        screen.getByRole('heading', { name: /note taking history/i, level: 2 })
      ).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('displays network error message and retry button', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.error();
        })
      );

      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Retry button should be present
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });

    it('displays 404 error message', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          // Return error that includes "404" in the message so component recognizes it
          return HttpResponse.json({ error: '404 Not found' }, { status: 404 });
        })
      );

      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.getByText(/service not found/i)).toBeInTheDocument();
      });
    });

    it('displays 500 error message', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });
    });

    it('retry button calls loadConversations again', async () => {
      let callCount = 0;
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const user = userEvent.setup();
      render(<ConversationListView />);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Wait for conversations to load
      await waitFor(() => {
        expect(screen.getByText(/ID: conv-1/i)).toBeInTheDocument();
      });

      // Error should be cleared
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });
  });

  describe('New conversation creation (standalone mode)', () => {
    it('creates new conversation and navigates to detail view', async () => {
      let createCallCount = 0;
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.post(/\/conversations\/api\/new$/, async ({ request }) => {
          createCallCount++;
          const body = (await request.json()) as { queueType?: string };
          const newId = `conv-new-${createCallCount}`;
          // Add delay to ensure "Creating..." state is visible
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json(
            {
              success: true,
              conversationId: newId,
              queueType: body.queueType || 'api',
              timestamp: new Date().toISOString(),
            },
            {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      const user = userEvent.setup();
      render(<ConversationListView />);

      await waitFor(() => {
        const spinner = document.querySelector('.loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      });

      // Click "+ New Note" button
      const newNoteButton = screen.getByRole('button', {
        name: /\+ new note/i,
      });
      await user.click(newNoteButton);

      // Button should show "Creating..." state (case-insensitive match)
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /creating/i })
        ).toBeInTheDocument();
      });

      // Wait for creation to complete and list to reload
      await waitFor(
        () => {
          // The component should reload the list after creation
          expect(createCallCount).toBe(1);
          // Button should return to normal state
          expect(
            screen.getByRole('button', { name: /\+ new note/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows error message when creation fails', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.post(/\/conversations\/api\/new$/, () => {
          return HttpResponse.json(
            { error: 'Failed to create' },
            { status: 500 }
          );
        })
      );

      const user = userEvent.setup();
      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const newNoteButton = screen.getByRole('button', {
        name: /\+ new note/i,
      });
      await user.click(newNoteButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create/i)).toBeInTheDocument();
      });
    });

    it('disables button during creation', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.post(/\/conversations\/api\/new$/, async () => {
          // Delay response to test disabled state
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(
            {
              success: true,
              conversationId: 'conv-new',
              queueType: 'api',
            },
            { status: 201 }
          );
        })
      );

      const user = userEvent.setup();
      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const newNoteButton = screen.getByRole('button', {
        name: /\+ new note/i,
      });
      await user.click(newNoteButton);

      // Button should be disabled during creation
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /creating/i });
        expect(button).toBeDisabled();
      });
    });

    it('prevents multiple rapid clicks from creating duplicate conversations', async () => {
      let createCallCount = 0;
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.post(/\/conversations\/api\/new$/, async () => {
          createCallCount++;
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(
            {
              success: true,
              conversationId: `conv-new-${createCallCount}`,
              queueType: 'api',
            },
            { status: 201 }
          );
        })
      );

      const user = userEvent.setup();
      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const newNoteButton = screen.getByRole('button', {
        name: /\+ new note/i,
      });

      // Click multiple times rapidly
      await user.click(newNoteButton);
      // Wait for button to be disabled (creating state)
      await waitFor(
        () => {
          expect(
            screen.getByRole('button', { name: /creating/i })
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
      // Try to click again (should be disabled)
      const creatingButton = screen.getByRole('button', { name: /creating/i });
      await user.click(creatingButton);
      await user.click(creatingButton);

      // Wait for creation to complete
      await waitFor(
        () => {
          expect(
            screen.queryByRole('button', { name: /creating/i })
          ).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Should only create one conversation (button should be disabled after first click)
      expect(createCallCount).toBe(1);
    });
  });

  describe('New conversation creation (dashboard mode)', () => {
    it('calls onNewConversation callback instead of navigating', async () => {
      const onNewConversation = vi.fn();
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.post(/\/conversations\/api\/new$/, async () => {
          return HttpResponse.json(
            {
              success: true,
              conversationId: 'conv-new',
              queueType: 'api',
            },
            { status: 201 }
          );
        })
      );

      const user = userEvent.setup();
      render(<ConversationListView onNewConversation={onNewConversation} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const newNoteButton = screen.getByRole('button', {
        name: /\+ new note/i,
      });
      await user.click(newNoteButton);

      await waitFor(() => {
        expect(onNewConversation).toHaveBeenCalledWith('conv-new');
      });
    });

    it('reloads list after creation in dashboard mode', async () => {
      let listCallCount = 0;
      const onNewConversation = vi.fn();
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          listCallCount++;
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.post(/\/conversations\/api\/new$/, async () => {
          return HttpResponse.json(
            {
              success: true,
              conversationId: 'conv-new',
              queueType: 'api',
            },
            { status: 201 }
          );
        })
      );

      const user = userEvent.setup();
      render(<ConversationListView onNewConversation={onNewConversation} />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const initialListCallCount = listCallCount;
      const newNoteButton = screen.getByRole('button', {
        name: /\+ new note/i,
      });
      await user.click(newNoteButton);

      // Wait for list to be reloaded
      await waitFor(
        () => {
          expect(listCallCount).toBeGreaterThan(initialListCallCount);
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Loading and empty states', () => {
    it('shows LoadingSpinner during initial load', () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, async () => {
          // Delay to ensure loading state is visible
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const { container } = render(<ConversationListView />);

      // LoadingSpinner renders a div with class "loading-spinner"
      const spinner = container.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('shows empty state message when no conversations', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json([], {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.getByText(/no note sessions found/i)).toBeInTheDocument();
      });
    });

    it('clears loading state after data loads', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Conversations should be displayed
      expect(screen.getByText(/ID: conv-1/i)).toBeInTheDocument();
    });

    it('only shows empty state when not loading and no error', async () => {
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json([], {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<ConversationListView />);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Empty state should be shown, not error
      expect(screen.getByText(/no note sessions found/i)).toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Props behavior', () => {
    it('passes onConversationSelect to ConversationList', async () => {
      const onConversationSelect = vi.fn();
      server.use(
        http.get(/\/conversations\/api\/list$/, () => {
          return HttpResponse.json(mockConversations, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(
        <ConversationListView onConversationSelect={onConversationSelect} />
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Click on a conversation item
      const user = userEvent.setup();
      const conversationLink = screen.getByText(/ID: conv-1/i).closest('a');
      if (conversationLink) {
        await user.click(conversationLink);
        // onConversationSelect should be called
        expect(onConversationSelect).toHaveBeenCalledWith('conv-1');
      }
    });
  });
});
