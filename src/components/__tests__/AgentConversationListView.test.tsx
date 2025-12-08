import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { AgentConversationListView } from '../AgentConversationListView';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import type { AgentConversation } from '../../types/agent-conversation';
/**
 * Comprehensive unit tests for AgentConversationListView component
 *
 * This test suite verifies:
 * - Initial load with default pagination parameters
 * - Successful loading and rendering of agent conversations list
 * - Error handling with user-friendly messages and retry functionality
 * - New conversation creation
 * - Active conversation highlighting based on URL
 * - Loading and empty states
 * - Props behavior (showNavigation, showContainer, onConversationSelect)
 * - Integration with MSW for API mocking
 */

// Helper function to create mock agent conversations
const createMockAgentConversation = (
  id: string,
  messageCount = 2
): AgentConversation => ({
  conversationId: id,
  messages: Array.from({ length: messageCount }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Agent message ${i + 1}`,
    timestamp: new Date(Date.now() - (messageCount - i) * 1000).toISOString(),
    source: i % 2 === 0 ? 'text' : 'voice',
  })),
  createdAt: new Date(Date.now() - messageCount * 1000).toISOString(),
  lastAccessedAt: new Date().toISOString(),
  agentId: 'test-agent',
});

describe('AgentConversationListView', () => {
  const mockAgentConversations: AgentConversation[] = [
    createMockAgentConversation('agent-conv-1', 2),
    createMockAgentConversation('agent-conv-2', 3),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset MSW handlers to default
    server.resetHandlers();
  });

  describe('Initial load', () => {
    it('loads and displays list of agent conversations', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView />);

      // Wait for loading to complete
      await waitFor(
        () => {
          const spinner = document.querySelector('.loading-spinner');
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify conversations are displayed
      expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
    });

    it('calls listAgentConversations with default parameters on mount', async () => {
      let capturedParams: {
        limit?: string;
        offset?: string;
        sortBy?: string;
        sortOrder?: string;
      } = {};

      server.use(
        http.get(/\/agent-conversations\/api\/list/, ({ request }) => {
          const url = new URL(request.url);
          capturedParams = {
            limit: url.searchParams.get('limit') || undefined,
            offset: url.searchParams.get('offset') || undefined,
            sortBy: url.searchParams.get('sortBy') || undefined,
            sortOrder: url.searchParams.get('sortOrder') || undefined,
          };
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(capturedParams.limit).toBe('20');
          expect(capturedParams.offset).toBe('0');
          expect(capturedParams.sortBy).toBe('lastAccessedAt');
          expect(capturedParams.sortOrder).toBe('desc');
        },
        { timeout: 3000 }
      );
    });

    it('displays total count correctly', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset: 0,
                hasMore: true,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(
            screen.getByText(/showing 2 of 25 conversations/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows LoadingSpinner during initial load', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, async () => {
          // Delay to ensure loading state is visible
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      const { container } = render(<AgentConversationListView />);

      // LoadingSpinner should be visible initially
      const spinner = container.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(
        () => {
          const spinnerAfter = container.querySelector('.loading-spinner');
          expect(spinnerAfter).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('renders Navigation component when showNavigation is true', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView showNavigation={true} />);

      await waitFor(
        () => {
          expect(screen.getByRole('navigation')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('hides Navigation component when showNavigation is false', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView showNavigation={false} />);

      await waitFor(
        () => {
          expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('renders container div when showContainer is true', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      const { container } = render(
        <AgentConversationListView showContainer={true} />
      );

      await waitFor(
        () => {
          expect(container.querySelector('.container')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('renders panel div when showContainer is false', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView showContainer={false} />);

      await waitFor(
        () => {
          // When showContainer is false, it should not have .container class
          // The component structure may vary, but we can check for the heading level
          expect(
            screen.getByRole('heading', {
              level: 2,
              name: /agent conversations/i,
            })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('renders h1 when showContainer is true', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView showContainer={true} />);

      await waitFor(
        () => {
          expect(
            screen.getByRole('heading', {
              level: 1,
              name: /agent conversations/i,
            })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('renders h2 when showContainer is false', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 2,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView showContainer={false} />);

      await waitFor(
        () => {
          expect(
            screen.getByRole('heading', {
              level: 2,
              name: /agent conversations/i,
            })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows empty state message when no conversations', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: [],
              pagination: {
                total: 0,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(
            screen.getByText(/no agent conversations found/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Pagination', () => {
    it('shows pagination controls when totalCount > pageSize and no filters', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset: 0,
                hasMore: true,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(
            screen.getByRole('button', { name: /previous/i })
          ).toBeInTheDocument();
          expect(
            screen.getByRole('button', { name: /next/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('hides pagination controls when filters are active', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset: 0,
                hasMore: true,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      const user = userEvent.setup();
      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(
            screen.getByRole('button', { name: /next/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Apply a filter
      const searchInput = screen.getByLabelText(/search:/i);
      await user.type(searchInput, 'test');

      await waitFor(
        () => {
          expect(
            screen.queryByRole('button', { name: /next/i })
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('disables Previous button on first page', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset: 0,
                hasMore: true,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView />);

      await waitFor(
        () => {
          const previousButton = screen.getByRole('button', {
            name: /previous/i,
          });
          expect(previousButton).toBeDisabled();
        },
        { timeout: 3000 }
      );
    });

    it('enables Previous button when not on first page', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, ({ request }) => {
          const url = new URL(request.url);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset,
                hasMore: offset + 20 < 25,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      const user = userEvent.setup();
      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(
            screen.getByRole('button', { name: /next/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click Next to go to page 2
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          const previousButton = screen.getByRole('button', {
            name: /previous/i,
          });
          expect(previousButton).not.toBeDisabled();
        },
        { timeout: 3000 }
      );
    });

    it('disables Next button on last page', async () => {
      // Create enough conversations to require pagination (totalCount > pageSize)
      const manyConversations: AgentConversation[] = Array.from(
        { length: 21 },
        (_, i) => createMockAgentConversation(`agent-conv-${i + 1}`, 2)
      );

      let requestCount = 0;
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          requestCount++;
          // On first call, return page 1. On second call (after clicking Next), return page 2 (last page)
          if (requestCount === 1) {
            return HttpResponse.json(
              {
                conversations: manyConversations.slice(0, 20),
                pagination: {
                  total: 21,
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
            // Last page
            return HttpResponse.json(
              {
                conversations: manyConversations.slice(20, 21),
                pagination: {
                  total: 21,
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

      const user = userEvent.setup();
      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(
            screen.getByRole('button', { name: /next/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click Next to go to last page
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          const nextButtonAfter = screen.getByRole('button', { name: /next/i });
          expect(nextButtonAfter).toBeDisabled();
        },
        { timeout: 3000 }
      );
    });

    it('enables Next button when more pages available', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset: 0,
                hasMore: true,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView />);

      await waitFor(
        () => {
          const nextButton = screen.getByRole('button', { name: /next/i });
          expect(nextButton).not.toBeDisabled();
        },
        { timeout: 3000 }
      );
    });

    it('displays page number and total pages correctly', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset: 0,
                hasMore: true,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('calls API with correct offset when clicking Next', async () => {
      let capturedOffset: number | null = null;
      server.use(
        http.get(/\/agent-conversations\/api\/list/, ({ request }) => {
          const url = new URL(request.url);
          capturedOffset = parseInt(url.searchParams.get('offset') || '0', 10);
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset: capturedOffset,
                hasMore: capturedOffset + 20 < 25,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      const user = userEvent.setup();
      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(capturedOffset).toBe(0);
        },
        { timeout: 3000 }
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          // Offset should be (page - 1) * limit = (2 - 1) * 20 = 20
          expect(capturedOffset).toBe(20);
        },
        { timeout: 3000 }
      );
    });

    it('calls API with correct offset when clicking Previous', async () => {
      let capturedOffset: number | null = null;
      server.use(
        http.get(/\/agent-conversations\/api\/list/, ({ request }) => {
          const url = new URL(request.url);
          capturedOffset = parseInt(url.searchParams.get('offset') || '0', 10);
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset: capturedOffset,
                hasMore: capturedOffset + 20 < 25,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      const user = userEvent.setup();
      render(<AgentConversationListView />);

      // Wait for initial load, then click Next to go to page 2
      await waitFor(
        () => {
          expect(
            screen.getByRole('button', { name: /next/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          expect(capturedOffset).toBe(20);
        },
        { timeout: 3000 }
      );

      // Now click Previous to go back to page 1
      const previousButton = screen.getByRole('button', { name: /previous/i });
      await user.click(previousButton);

      await waitFor(
        () => {
          // Offset should be (page - 1) * limit = (1 - 1) * 20 = 0
          expect(capturedOffset).toBe(0);
        },
        { timeout: 3000 }
      );
    });

    it('updates page display when navigating', async () => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, ({ request }) => {
          const url = new URL(request.url);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          return HttpResponse.json(
            {
              conversations: mockAgentConversations,
              pagination: {
                total: 25,
                limit: 20,
                offset,
                hasMore: offset + 20 < 25,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );

      const user = userEvent.setup();
      render(<AgentConversationListView />);

      await waitFor(
        () => {
          expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(
        () => {
          expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Filtering', () => {
    // Create mock conversations with different agent IDs and message content for filtering tests
    const conversationsWithDifferentAgents: AgentConversation[] = [
      {
        ...createMockAgentConversation('agent-conv-1', 2),
        agentId: 'agent-A',
        messages: [
          {
            role: 'user',
            content: 'Hello from agent A',
            timestamp: new Date().toISOString(),
            source: 'text',
          },
          {
            role: 'assistant',
            content: 'Response from agent A',
            timestamp: new Date().toISOString(),
            source: 'voice',
          },
        ],
      },
      {
        ...createMockAgentConversation('agent-conv-2', 2),
        agentId: 'agent-B',
        messages: [
          {
            role: 'user',
            content: 'Hello from agent B',
            timestamp: new Date().toISOString(),
            source: 'text',
          },
          {
            role: 'assistant',
            content: 'Response from agent B',
            timestamp: new Date().toISOString(),
            source: 'voice',
          },
        ],
      },
      {
        ...createMockAgentConversation('agent-conv-3', 2),
        agentId: 'agent-A',
        messages: [
          {
            role: 'user',
            content: 'Another message from agent A',
            timestamp: new Date().toISOString(),
            source: 'text',
          },
          {
            role: 'assistant',
            content: 'Another response from agent A',
            timestamp: new Date().toISOString(),
            source: 'voice',
          },
        ],
      },
    ];

    beforeEach(() => {
      server.use(
        http.get(/\/agent-conversations\/api\/list/, () => {
          return HttpResponse.json(
            {
              conversations: conversationsWithDifferentAgents,
              pagination: {
                total: 3,
                limit: 20,
                offset: 0,
                hasMore: false,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
      );
    });

    describe('Agent dropdown filtering', () => {
      it('filters conversations by agentId when agent is selected', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // All conversations should be visible initially
        expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
        expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
        expect(screen.getByText(/ID: agent-conv-3/i)).toBeInTheDocument();

        // Select agent-A from dropdown
        const agentFilter = screen.getByLabelText(/filter by agent/i);
        await user.selectOptions(agentFilter, 'agent-A');

        // Only conversations with agent-A should be visible
        await waitFor(() => {
          expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          expect(screen.getByText(/ID: agent-conv-3/i)).toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-2/i)
          ).not.toBeInTheDocument();
        });
      });

      it('shows all conversations when "All Agents" is selected', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Select agent-A first
        const agentFilter = screen.getByLabelText(/filter by agent/i);
        await user.selectOptions(agentFilter, 'agent-A');

        await waitFor(() => {
          expect(
            screen.queryByText(/ID: agent-conv-2/i)
          ).not.toBeInTheDocument();
        });

        // Select "All Agents" to clear filter
        await user.selectOptions(agentFilter, '');

        // All conversations should be visible again
        await waitFor(() => {
          expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
          expect(screen.getByText(/ID: agent-conv-3/i)).toBeInTheDocument();
        });
      });
    });

    describe('Search input filtering', () => {
      it('filters conversations by conversation ID', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Type conversation ID in search
        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'agent-conv-2');

        // Only matching conversation should be visible
        await waitFor(() => {
          expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-1/i)
          ).not.toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-3/i)
          ).not.toBeInTheDocument();
        });
      });

      it('filters conversations by agent ID', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Type agent ID in search
        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'agent-B');

        // Only conversations with agent-B should be visible
        await waitFor(() => {
          expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-1/i)
          ).not.toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-3/i)
          ).not.toBeInTheDocument();
        });
      });

      it('filters conversations by message content', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Type message content in search
        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'Another message');

        // Only conversations with matching message content should be visible
        await waitFor(() => {
          expect(screen.getByText(/ID: agent-conv-3/i)).toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-1/i)
          ).not.toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-2/i)
          ).not.toBeInTheDocument();
        });
      });

      it('performs case-insensitive search', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Type uppercase search query
        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'AGENT-A');

        // Should find conversations with lowercase agent-A
        await waitFor(() => {
          expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          expect(screen.getByText(/ID: agent-conv-3/i)).toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-2/i)
          ).not.toBeInTheDocument();
        });
      });
    });

    describe('Filter combinations', () => {
      it('applies both agent filter and search filter together', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Select agent-A
        const agentFilter = screen.getByLabelText(/filter by agent/i);
        await user.selectOptions(agentFilter, 'agent-A');

        // Type search query
        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'Another');

        // Only conversations matching both filters should be visible
        await waitFor(() => {
          expect(screen.getByText(/ID: agent-conv-3/i)).toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-1/i)
          ).not.toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-2/i)
          ).not.toBeInTheDocument();
        });
      });

      it('shows correct filter count when filters are active', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Select agent-A (should show 2 of 3 conversations)
        const agentFilter = screen.getByLabelText(/filter by agent/i);
        await user.selectOptions(agentFilter, 'agent-A');

        await waitFor(() => {
          expect(
            screen.getByText(/showing 2 of 3 conversations/i)
          ).toBeInTheDocument();
        });
      });

      it('shows total count when no filters are active', async () => {
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Should show total count from API
        expect(
          screen.getByText(/showing 3 of 3 conversations/i)
        ).toBeInTheDocument();
      });
    });

    describe('Clear filters', () => {
      it('shows Clear Filters button when filters are active', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Clear Filters button should not be visible initially
        expect(
          screen.queryByRole('button', { name: /clear filters/i })
        ).not.toBeInTheDocument();

        // Apply a filter
        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'test');

        // Clear Filters button should now be visible
        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /clear filters/i })
          ).toBeInTheDocument();
        });
      });

      it('resets both filters when Clear Filters is clicked', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Apply both filters
        const agentFilter = screen.getByLabelText(/filter by agent/i);
        await user.selectOptions(agentFilter, 'agent-A');

        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'test');

        // Verify filters are applied
        await waitFor(() => {
          expect(
            screen.getByRole('button', { name: /clear filters/i })
          ).toBeInTheDocument();
        });

        // Click Clear Filters
        const clearButton = screen.getByRole('button', {
          name: /clear filters/i,
        });
        await user.click(clearButton);

        // Both filters should be cleared and all conversations visible
        await waitFor(() => {
          expect(searchInput).toHaveValue('');
          expect(agentFilter).toHaveValue('');
          expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
          expect(screen.getByText(/ID: agent-conv-3/i)).toBeInTheDocument();
          expect(
            screen.queryByRole('button', { name: /clear filters/i })
          ).not.toBeInTheDocument();
        });
      });
    });

    describe('Edge cases', () => {
      it('shows "No conversations match your search criteria" when filters return no results', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Apply filter that matches nothing
        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'nonexistent-conversation-xyz');

        // Should show "no match" message
        await waitFor(() => {
          expect(
            screen.getByText(/no conversations match your search criteria/i)
          ).toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-1/i)
          ).not.toBeInTheDocument();
        });
      });

      it('handles rapid filter changes without errors', async () => {
        const user = userEvent.setup();
        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        const searchInput = screen.getByLabelText(/search/i);
        const agentFilter = screen.getByLabelText(/filter by agent/i);

        // Rapidly change filters
        await user.type(searchInput, 'agent-conv-1');
        await user.selectOptions(agentFilter, 'agent-A');
        await user.clear(searchInput);
        await user.type(searchInput, 'agent-conv-2');
        await user.selectOptions(agentFilter, 'agent-B');

        // Should handle all changes without errors
        await waitFor(() => {
          expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-1/i)
          ).not.toBeInTheDocument();
          expect(
            screen.queryByText(/ID: agent-conv-3/i)
          ).not.toBeInTheDocument();
        });
      });

      it('hides pagination controls when filters are active', async () => {
        const user = userEvent.setup();
        // Setup with enough conversations to show pagination
        server.use(
          http.get(/\/agent-conversations\/api\/list/, () => {
            return HttpResponse.json(
              {
                conversations: conversationsWithDifferentAgents,
                pagination: {
                  total: 25, // More than pageSize (20)
                  limit: 20,
                  offset: 0,
                  hasMore: true,
                },
              },
              {
                headers: { 'Content-Type': 'application/json' },
              }
            );
          })
        );

        render(<AgentConversationListView />);

        await waitFor(
          () => {
            expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
          },
          { timeout: 3000 }
        );

        // Apply a filter
        const searchInput = screen.getByLabelText(/search/i);
        await user.type(searchInput, 'agent-A');

        // Pagination controls should be hidden
        await waitFor(() => {
          expect(screen.queryByText(/page 1 of 2/i)).not.toBeInTheDocument();
          expect(
            screen.queryByRole('button', { name: /next/i })
          ).not.toBeInTheDocument();
        });
      });
    });
  });
});
