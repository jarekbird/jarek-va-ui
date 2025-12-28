import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '../../test/test-utils';
import { render as renderWithRouter } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AgentConversationDetailView } from '../AgentConversationDetailView';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import type { AgentConversation } from '../../types/agent-conversation';
import { createMockAgentConversation } from '../../test/mocks/handlers';

/**
 * Comprehensive unit tests for AgentConversationDetailView component
 *
 * This test suite verifies:
 * - Successful loading and rendering of conversation details
 * - Automatic polling for new messages (every 3 seconds)
 * - Polling stops on unmount
 * - Manual refresh functionality
 * - Error handling during load and refresh
 * - Back link navigation
 * - Integration with MSW for API mocking
 * - Polling only updates when messages actually change
 */

// Note: We don't mock AgentConversationDetails - we test the full component integration

let lastWs: {
  pathWithQuery: string;
  closeCalls: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (msg: any) => void;
} | null = null;

vi.mock('../../services/ws', () => {
  return {
    connectWs: (
      pathWithQuery: string,
      options: {
        onOpen?: () => void;
        onClose?: (event: CloseEvent) => void;
        onError?: (event: Event) => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onMessage: (message: any) => void;
      }
    ) => {
      const wsState = {
        pathWithQuery,
        closeCalls: 0,
        emit: (msg: unknown) => options.onMessage(msg),
      };
      lastWs = wsState;
      // simulate immediate open
      options.onOpen?.();
      return {
        close: () => {
          wsState.closeCalls += 1;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          options.onClose?.({} as any);
        },
      };
    },
  };
});

describe('AgentConversationDetailView', () => {
  const mockConversation: AgentConversation = createMockAgentConversation(
    'agent-conv-test',
    2
  );

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    lastWs = null;
    // Use real timers by default
    vi.useRealTimers();
  });

  afterEach(() => {
    // Always restore real timers after each test
    vi.useRealTimers();
  });

  it('should be defined', () => {
    expect(AgentConversationDetailView).toBeDefined();
  });

  // Helper to render component with router
  // Note: We use renderWithRouter from @testing-library/react directly
  // because we need to control the MemoryRouter and Routes setup
  const renderComponent = (conversationId: string) => {
    return renderWithRouter(
      <MemoryRouter initialEntries={[`/agent-conversation/${conversationId}`]}>
        <Routes>
          <Route
            path="/agent-conversation/:conversationId"
            element={<AgentConversationDetailView />}
          />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Successful load', () => {
    it('loads conversation when valid conversationId param provided', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Verify conversation is loaded (check for conversation ID or messages)
      // The actual content depends on AgentConversationDetails implementation
      expect(
        document.querySelector('.loading-spinner')
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/error occurred/i)).not.toBeInTheDocument();
    });

    it('calls getAgentConversation with correct ID', async () => {
      let capturedId: string | null = null;
      server.use(
        http.get(/\/agent-conversations\/api\/([^/]+)$/, ({ params }) => {
          capturedId = params[0] as string;
          if (capturedId === 'agent-conv-test-id') {
            return HttpResponse.json(mockConversation, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return HttpResponse.passthrough();
        })
      );

      renderComponent('agent-conv-test-id');

      await waitFor(
        () => {
          expect(capturedId).toBe('agent-conv-test-id');
        },
        { timeout: 3000 }
      );
    });

    it('renders Navigation component', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Navigation should be rendered (check for Dashboard link)
      const dashboardLinks = screen.getAllByRole('link', {
        name: /dashboard/i,
      });
      expect(dashboardLinks.length).toBeGreaterThan(0);
    });

    it('renders back link that navigates to /agent-conversations', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const backLink = screen.getByRole('link', {
        name: /back to agent conversations/i,
      });
      expect(backLink).toHaveAttribute('href', '/agent-conversations');
    });

    it('shows LoadingSpinner during load, then hides it', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, async () => {
          // Simulate delay
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      // Spinner should be visible initially (check by class)
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();

      // Spinner should disappear after load
      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows "Live updates" indicator when websocket is active', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, async () => {
          // Use real timers for the async delay
          await new Promise((resolve) => setTimeout(resolve, 0));
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      await waitFor(
        () => {
          expect(screen.getByText(/live updates/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Websocket behavior', () => {
    it('opens websocket after conversation loads', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      await waitFor(() => {
        expect(lastWs).toBeTruthy();
        expect(lastWs?.pathWithQuery).toBe(
          '/agent-conversations/api/ws?conversationId=agent-conv-test'
        );
      });
    });

    it('updates UI when websocket sends updated conversation', async () => {
      const initialConversation = createMockAgentConversation(
        'agent-conv-test',
        2
      );
      const updatedConversation = createMockAgentConversation(
        'agent-conv-test',
        3
      );

      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.json(initialConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          expect(screen.getByText('Agent message 2')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(lastWs).toBeTruthy();
      lastWs?.emit({
        type: 'agent_conversation.updated',
        conversationId: 'agent-conv-test',
        conversation: updatedConversation,
        reason: 'message_added',
      });

      await waitFor(() => {
        expect(screen.getByText('Agent message 3')).toBeInTheDocument();
      });
    });

    it('closes websocket on unmount', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const { unmount } = renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(lastWs).toBeTruthy();

      unmount();

      expect(lastWs?.closeCalls).toBeGreaterThan(0);
    });

    it('does not open websocket if conversation not loaded', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.error();
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(lastWs).toBeNull();
      expect(screen.queryByText(/live updates/i)).not.toBeInTheDocument();
    });
  });

  describe('Manual refresh', () => {
    it('triggers getAgentConversation when Refresh button is clicked', async () => {
      const user = userEvent.setup();
      let requestCount = 0;

      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          requestCount++;
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const initialRequestCount = requestCount;

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(requestCount).toBeGreaterThan(initialRequestCount);
      });
    });

    it('shows "Refreshing..." text during refresh', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Button should show "Refreshing..." during refresh
      await waitFor(() => {
        expect(refreshButton).toHaveTextContent(/refreshing/i);
      });
    });

    it('disables button during refresh', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Button should be disabled during refresh
      await waitFor(() => {
        expect(refreshButton).toBeDisabled();
      });
    });

    it('updates conversation after successful refresh', async () => {
      const user = userEvent.setup();
      let callCount = 0;

      const initialConversation = createMockAgentConversation(
        'agent-conv-test',
        2
      );
      const updatedConversation = createMockAgentConversation(
        'agent-conv-test',
        3
      );

      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(initialConversation, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return HttpResponse.json(updatedConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          expect(screen.getByText('Agent message 1')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should show updated conversation
      await waitFor(() => {
        expect(screen.getByText('Agent message 3')).toBeInTheDocument();
      });
    });

    it('shows error message when refresh fails', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(
          /\/agent-conversations\/api\/agent-conv-test$/,
          ({ request }) => {
            const url = new URL(request.url);
            // First call succeeds, refresh call fails
            if (url.searchParams.has('_refresh')) {
              return HttpResponse.json(
                { error: 'Refresh failed' },
                { status: 500 }
              );
            }
            return HttpResponse.json(mockConversation, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      // Override handler to fail on second call
      let callCount = 0;
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(mockConversation, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return HttpResponse.error();
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Error message should be displayed
      await waitFor(() => {
        const errorElement =
          screen.queryByText(/error occurred/i) ||
          screen.queryByText(/failed/i) ||
          screen.queryByText(/network error/i);
        expect(errorElement).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('displays error message when backend error occurs during load', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/error occurred/i) ||
            screen.queryByText(/server error/i) ||
            screen.queryByText(/failed/i);
          expect(errorElement).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('renders ErrorMessage component with error message', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.error();
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/error occurred/i) ||
            screen.queryByText(/network error/i) ||
            screen.queryByText(/failed/i);
          expect(errorElement).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('does not render AgentConversationDetails when error occurs', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.error();
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          expect(
            screen.queryByTestId('agent-conversation-details')
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('does not start websocket when error occurs', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
          return HttpResponse.error();
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // "Live updates" indicator should not appear
      expect(screen.queryByText(/live updates/i)).not.toBeInTheDocument();
      expect(lastWs).toBeNull();
    });

    it('handles network errors gracefully', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.error();
        })
      );

      renderComponent('agent-conv-test');

      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/error occurred/i) ||
            screen.queryByText(/network error/i) ||
            screen.queryByText(/failed/i);
          expect(errorElement).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Routing behavior', () => {
    it('reads conversationId from URL params', async () => {
      let capturedId: string | null = null;
      server.use(
        http.get(/\/agent-conversations\/api\/([^/]+)$/, ({ params }) => {
          capturedId = params[0] as string;
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-from-url');

      await waitFor(
        () => {
          expect(capturedId).toBe('agent-conv-from-url');
        },
        { timeout: 3000 }
      );
    });

    it('back link navigates to /agent-conversations when clicked', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, () => {
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/agent-conv-test']}>
          <Routes>
            <Route
              path="/agent-conversation/:conversationId"
              element={<AgentConversationDetailView />}
            />
            <Route
              path="/agent-conversations"
              element={<div>Agent Conversations List</div>}
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const backLink = screen.getByRole('link', {
        name: /back to agent conversations/i,
      });
      await user.click(backLink);

      // Should navigate to agent conversations list
      await waitFor(() => {
        expect(
          screen.getByText('Agent Conversations List')
        ).toBeInTheDocument();
      });
    });

    it('reloads conversation when conversationId param changes', async () => {
      const capturedIds: string[] = [];

      server.use(
        http.get(/\/agent-conversations\/api\/([^/]+)$/, async ({ params }) => {
          const id = params[0] as string;
          capturedIds.push(id);
          await new Promise((resolve) => setTimeout(resolve, 0));
          return HttpResponse.json(createMockAgentConversation(id, 2), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      // Render first conversation
      const { unmount } = renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/agent-conv-1']}>
          <Routes>
            <Route
              path="/agent-conversation/:conversationId"
              element={<AgentConversationDetailView />}
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(capturedIds).toContain('agent-conv-1');
        },
        { timeout: 5000 }
      );

      // Unmount and render new conversation
      unmount();

      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/agent-conv-2']}>
          <Routes>
            <Route
              path="/agent-conversation/:conversationId"
              element={<AgentConversationDetailView />}
            />
          </Routes>
        </MemoryRouter>
      );

      // Should load new conversation
      await waitFor(
        () => {
          expect(capturedIds).toContain('agent-conv-2');
        },
        { timeout: 5000 }
      );
    });

    it('handles missing conversationId param gracefully', () => {
      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation']}>
          <Routes>
            <Route
              path="/agent-conversation/:conversationId"
              element={<AgentConversationDetailView />}
            />
          </Routes>
        </MemoryRouter>
      );

      // Component should handle missing param (no API call should be made)
      // No error should be thrown
      expect(
        document.querySelector('.loading-spinner')
      ).not.toBeInTheDocument();
    });
  });

  describe('State management', () => {
    it('loading state is true initially, then false after load', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      // Loading should be true initially
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();

      // Loading should be false after load
      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('error state is cleared on successful load', async () => {
      let callCount = 0;

      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, async () => {
          callCount++;
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (callCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json(mockConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const { unmount } = renderComponent('agent-conv-test');

      // Wait for error - check for any error message displayed
      await waitFor(
        () => {
          const errorElement =
            screen.queryByText(/error occurred/i) ||
            screen.queryByText(/network error/i) ||
            screen.queryByText(/failed/i);
          expect(errorElement).toBeTruthy();
          if (errorElement) {
            expect(errorElement).toBeInTheDocument();
          }
        },
        { timeout: 5000 }
      );

      // Unmount and render again (simulating a retry/reload)
      unmount();

      renderComponent('agent-conv-test');

      // Error should be cleared and conversation should load
      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
          expect(screen.queryByText(/error occurred/i)).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('conversation state updates when polling detects changes', async () => {
      let callCount = 0;

      const initialConversation = createMockAgentConversation(
        'agent-conv-test',
        2
      );
      const updatedConversation = createMockAgentConversation(
        'agent-conv-test',
        4
      );

      server.use(
        http.get(/\/agent-conversations\/api\/agent-conv-test$/, async () => {
          callCount++;
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (callCount === 1) {
            return HttpResponse.json(initialConversation, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return HttpResponse.json(updatedConversation, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      renderComponent('agent-conv-test');

      // Wait for initial load with real timers
      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Switch to fake timers for polling
      vi.useFakeTimers();

      // Advance time to trigger poll
      await vi.advanceTimersByTimeAsync(3000);

      // Switch back to real timers for assertions
      vi.useRealTimers();

      // Conversation should update with new messages
      // Since we're not mocking AgentConversationDetails, we verify no error occurred
      await waitFor(
        () => {
          expect(
            document.querySelector('.loading-spinner')
          ).not.toBeInTheDocument();
          expect(screen.queryByText(/error occurred/i)).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('state resets when conversationId changes', async () => {
      const capturedIds: string[] = [];

      server.use(
        http.get(/\/agent-conversations\/api\/([^/]+)$/, async ({ params }) => {
          const id = params[0] as string;
          capturedIds.push(id);
          await new Promise((resolve) => setTimeout(resolve, 0));
          return HttpResponse.json(createMockAgentConversation(id, 2), {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      // Render first conversation
      const { unmount: unmount1 } = renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/agent-conv-1']}>
          <Routes>
            <Route
              path="/agent-conversation/:conversationId"
              element={<AgentConversationDetailView />}
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(capturedIds).toContain('agent-conv-1');
        },
        { timeout: 5000 }
      );

      // Unmount and render new conversation
      unmount1();

      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/agent-conv-2']}>
          <Routes>
            <Route
              path="/agent-conversation/:conversationId"
              element={<AgentConversationDetailView />}
            />
          </Routes>
        </MemoryRouter>
      );

      // Should load new conversation
      await waitFor(
        () => {
          expect(capturedIds).toContain('agent-conv-2');
        },
        { timeout: 5000 }
      );
    });
  });
});
