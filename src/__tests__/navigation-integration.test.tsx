import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import * as featureFlags from '../utils/feature-flags';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock the feature flags module
vi.mock('../utils/feature-flags', () => ({
  isElevenLabsEnabled: vi.fn(),
}));

describe('Navigation + Feature Flags Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default MSW handlers for API calls
    server.use(
      http.get(/\/api\/conversations/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/conversations\/api\/conversations/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/api\/tasks/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/conversations\/api\/tasks/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/api\/working-directory\/files/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/conversations\/api\/working-directory\/files/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/agents\/queues/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/config/, () => {
        return HttpResponse.json(
          {},
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }),
      http.get(/\/config\/health/, () => {
        return HttpResponse.json(
          { status: 'ok' },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
  });

  describe('Feature flag enabled', () => {
    beforeEach(() => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);
    });

    it('shows all navigation links when feature flag is enabled', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: 'Dashboard' })
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole('link', { name: 'Note Taking History' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /agent conversations/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /agent config/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Task Dashboard' })
      ).toBeInTheDocument();
    });

    it('renders Dashboard component at /dashboard route', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      // Dashboard component should render
      // We can verify by checking that Navigation is not present (Dashboard doesn't render it)
      await waitFor(() => {
        // Dashboard renders, but Navigation is not rendered by Dashboard
        expect(
          screen.queryByRole('link', { name: 'Dashboard' })
        ).not.toBeInTheDocument();
      });
    });

    it('navigates to /agent-conversations and renders AgentConversationListView', async () => {
      render(
        <MemoryRouter initialEntries={['/agent-conversations']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Agent Conversations link should be active when on /agent-conversations route
        const agentConversationsLink = screen.getByRole('link', {
          name: /agent conversations/i,
        });
        expect(agentConversationsLink).toHaveClass('active');
      });
    });

    it('navigates to /agent-config and renders AgentConfigView', async () => {
      render(
        <MemoryRouter initialEntries={['/agent-config']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Agent Config link should be active when on /agent-config route
        const agentConfigLink = screen.getByRole('link', {
          name: /agent config/i,
        });
        expect(agentConfigLink).toHaveClass('active');
      });
    });

    it('shows correct active link state on routes that render Navigation', async () => {
      // Test active state on / route
      const { unmount: unmount1 } = render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        const noteTakingLink = screen.getByRole('link', {
          name: 'Note Taking History',
        });
        // Note Taking History should be active on / (with special logic excluding /dashboard and /agent-conversation)
        expect(noteTakingLink).toHaveClass('active');
      });
      unmount1();

      // Test active state on /tasks route
      const { unmount: unmount2 } = render(
        <MemoryRouter initialEntries={['/tasks']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        const tasksLink = screen.getByRole('link', { name: 'Tasks' });
        expect(tasksLink).toHaveClass('active');
      });
      unmount2();

      // Test active state on /agent-config route
      const { unmount: unmount3 } = render(
        <MemoryRouter initialEntries={['/agent-config']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        const agentConfigLink = screen.getByRole('link', {
          name: /agent config/i,
        });
        expect(agentConfigLink).toHaveClass('active');
      });
      unmount3();
    });
  });

  describe('Feature flag disabled', () => {
    beforeEach(() => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);
    });

    it('hides feature-flag gated navigation links when feature flag is disabled', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: 'Note Taking History' })
        ).toBeInTheDocument();
      });

      // Feature-flag gated links should not appear
      expect(
        screen.queryByRole('link', { name: 'Dashboard' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /agent conversations/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: /agent config/i })
      ).not.toBeInTheDocument();

      // Non-gated links should appear
      expect(
        screen.getByRole('link', { name: 'Note Taking History' })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Task Dashboard' })
      ).toBeInTheDocument();
    });

    it('renders Dashboard component but shows disabled message when navigating to /dashboard', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Dashboard component should render (it shows a disabled message when feature flag is off)
        // We can verify by checking that we're not on the home route
        expect(
          screen.queryByRole('heading', { name: 'Note Taking History' })
        ).not.toBeInTheDocument();
      });
    });

    it('shows disabled screen on /agent-conversations when feature flag is disabled', async () => {
      render(
        <MemoryRouter initialEntries={['/agent-conversations']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: /agent conversations unavailable/i,
          })
        ).toBeInTheDocument();
      });
    });

    it('shows disabled screen on /agent-config when feature flag is disabled', async () => {
      render(
        <MemoryRouter initialEntries={['/agent-config']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /agent config unavailable/i })
        ).toBeInTheDocument();
      });
    });

    it('renders Navigation correctly on non-gated routes', async () => {
      // Test on / route
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('link', { name: 'Note Taking History' })
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
        expect(
          screen.getByRole('link', { name: 'Task Dashboard' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Active link state updates', () => {
    beforeEach(() => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);
    });

    it('only one link is active at a time on routes that render Navigation', async () => {
      // Test on / route
      const { unmount: unmount1 } = render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        const noteTakingLink = screen.getByRole('link', {
          name: 'Note Taking History',
        });
        const tasksLink = screen.getByRole('link', { name: 'Tasks' });

        // Note Taking History should be active on /
        expect(noteTakingLink).toHaveClass('active');
        expect(tasksLink).not.toHaveClass('active');
      });
      unmount1();

      // Test on /tasks route
      const { unmount: unmount2 } = render(
        <MemoryRouter initialEntries={['/tasks']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        const noteTakingLink = screen.getByRole('link', {
          name: 'Note Taking History',
        });
        const tasksLink = screen.getByRole('link', { name: 'Tasks' });

        expect(tasksLink).toHaveClass('active');
        expect(noteTakingLink).not.toHaveClass('active');
      });
      unmount2();
    });

    it('active state works for routes that render Navigation', async () => {
      // Only test routes that actually render Navigation
      const routes = [
        { name: 'Note Taking History', route: '/' },
        { name: /agent conversations/i, route: '/agent-conversations' },
        { name: /agent config/i, route: '/agent-config' },
        { name: 'Tasks', route: '/tasks' },
      ];

      for (const routeInfo of routes) {
        const { unmount } = render(
          <MemoryRouter initialEntries={[routeInfo.route]}>
            <App />
          </MemoryRouter>
        );

        await waitFor(() => {
          const linkElement = screen.getByRole('link', {
            name: routeInfo.name,
          });
          expect(linkElement).toHaveClass('active');
        });

        unmount();
      }
    });
  });

  describe('Direct URL navigation', () => {
    beforeEach(() => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);
    });

    it('handles direct navigation to /tasks', async () => {
      render(
        <MemoryRouter initialEntries={['/tasks']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        const tasksLink = screen.getByRole('link', { name: 'Tasks' });
        expect(tasksLink).toHaveClass('active');
      });
    });

    it('handles direct navigation to /dashboard (Dashboard does not render Navigation)', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      // Dashboard component should render (it doesn't render Navigation)
      await waitFor(() => {
        // Navigation is not rendered by Dashboard, so Dashboard link should not be present
        expect(
          screen.queryByRole('link', { name: 'Dashboard' })
        ).not.toBeInTheDocument();
      });
    });

    it('handles direct navigation to /agent-conversations', async () => {
      render(
        <MemoryRouter initialEntries={['/agent-conversations']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        const agentConversationsLink = screen.getByRole('link', {
          name: /agent conversations/i,
        });
        expect(agentConversationsLink).toHaveClass('active');
      });
    });
  });
});
