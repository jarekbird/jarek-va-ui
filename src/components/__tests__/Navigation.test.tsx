import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '../../test/test-utils';
import { render as renderWithRouter } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navigation } from '../Navigation';
import * as featureFlags from '../../utils/feature-flags';

// Mock the feature flags module
vi.mock('../../utils/feature-flags', () => ({
  isElevenLabsEnabled: vi.fn(),
}));

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature flag behavior', () => {
    it('shows Dashboard link when ElevenLabs is enabled', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.getByRole('link', { name: 'Dashboard' })
      ).toBeInTheDocument();
    });

    it('shows Agent Conversations link when ElevenLabs is enabled', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.getByRole('link', { name: /agent conversations/i })
      ).toBeInTheDocument();
    });

    it('shows Agent Config link when ElevenLabs is enabled', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.getByRole('link', { name: /agent config/i })
      ).toBeInTheDocument();
    });

    it('hides Dashboard link when ElevenLabs is disabled', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.queryByRole('link', { name: 'Dashboard' })
      ).not.toBeInTheDocument();
    });

    it('hides Agent Conversations link when ElevenLabs is disabled', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.queryByRole('link', { name: /agent conversations/i })
      ).not.toBeInTheDocument();
    });

    it('hides Agent Config link when ElevenLabs is disabled', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.queryByRole('link', { name: /agent config/i })
      ).not.toBeInTheDocument();
    });

    it('always shows Note Taking History link', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.getByRole('link', { name: /note taking history/i })
      ).toBeInTheDocument();
    });

    it('always shows Tasks link', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: /tasks/i })).toBeInTheDocument();
    });

    it('always shows Task Dashboard link', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.getByRole('link', { name: /task dashboard/i })
      ).toBeInTheDocument();
    });
  });

  describe('Active link states', () => {
    it('applies active class to Dashboard link when on /dashboard', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navigation />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toHaveClass('active');
    });

    it('applies active class to Note Taking History link when on /', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      const noteTakingLink = screen.getByRole('link', {
        name: /note taking history/i,
      });
      expect(noteTakingLink).toHaveClass('active');
    });

    it('applies active class to Agent Conversations link when on /agent-conversations', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversations']}>
          <Navigation />
        </MemoryRouter>
      );

      const agentConversationsLink = screen.getByRole('link', {
        name: /agent conversations/i,
      });
      expect(agentConversationsLink).toHaveClass('active');
    });

    it('applies active class to Agent Conversations link when on /agent-conversation/:id', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/123']}>
          <Navigation />
        </MemoryRouter>
      );

      const agentConversationsLink = screen.getByRole('link', {
        name: /agent conversations/i,
      });
      expect(agentConversationsLink).toHaveClass('active');
    });

    it('applies active class to Agent Config link when on /agent-config', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-config']}>
          <Navigation />
        </MemoryRouter>
      );

      const agentConfigLink = screen.getByRole('link', {
        name: /agent config/i,
      });
      expect(agentConfigLink).toHaveClass('active');
    });

    it('applies active class to Tasks link when on /tasks', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/tasks']}>
          <Navigation />
        </MemoryRouter>
      );

      const tasksLink = screen.getByRole('link', { name: /tasks/i });
      expect(tasksLink).toHaveClass('active');
    });

    it('applies active class to Task Dashboard link when on /task-dashboard', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/task-dashboard']}>
          <Navigation />
        </MemoryRouter>
      );

      const taskDashboardLink = screen.getByRole('link', {
        name: /task dashboard/i,
      });
      expect(taskDashboardLink).toHaveClass('active');
    });

    it('does not apply active class when on different routes', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      renderWithRouter(
        <MemoryRouter initialEntries={['/tasks']}>
          <Navigation />
        </MemoryRouter>
      );

      const noteTakingLink = screen.getByRole('link', {
        name: /note taking history/i,
      });
      expect(noteTakingLink).not.toHaveClass('active');
    });

    it('does not apply active class to Note Taking History when on /dashboard', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navigation />
        </MemoryRouter>
      );

      const noteTakingLink = screen.getByRole('link', {
        name: /note taking history/i,
      });
      expect(noteTakingLink).not.toHaveClass('active');
    });

    it('does not apply active class to Note Taking History when on /agent-conversation/:id', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/123']}>
          <Navigation />
        </MemoryRouter>
      );

      const noteTakingLink = screen.getByRole('link', {
        name: /note taking history/i,
      });
      expect(noteTakingLink).not.toHaveClass('active');
    });
  });

  describe('Routing behavior', () => {
    it('renders all links with correct hrefs', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
        'href',
        '/dashboard'
      );
      expect(
        screen.getByRole('link', { name: /note taking history/i })
      ).toHaveAttribute('href', '/');
      expect(
        screen.getByRole('link', { name: /agent conversations/i })
      ).toHaveAttribute('href', '/agent-conversations');
      expect(
        screen.getByRole('link', { name: /agent config/i })
      ).toHaveAttribute('href', '/agent-config');
      expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute(
        'href',
        '/tasks'
      );
      expect(
        screen.getByRole('link', { name: 'Task Dashboard' })
      ).toHaveAttribute('href', '/task-dashboard');
    });

    it('renders correctly with different initial routes', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(false);

      const { unmount } = renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(
        screen.getByRole('link', { name: /note taking history/i })
      ).toHaveClass('active');

      unmount();

      renderWithRouter(
        <MemoryRouter initialEntries={['/tasks']}>
          <Navigation />
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: 'Tasks' })).toHaveClass('active');
    });
  });

  describe('Edge cases', () => {
    it('handles nested routes correctly', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/123/details']}>
          <Navigation />
        </MemoryRouter>
      );

      const agentConversationsLink = screen.getByRole('link', {
        name: /agent conversations/i,
      });
      expect(agentConversationsLink).toHaveClass('active');
    });

    it('handles route changes correctly', () => {
      vi.mocked(featureFlags.isElevenLabsEnabled).mockReturnValue(true);

      const { unmount } = renderWithRouter(
        <MemoryRouter initialEntries={['/']}>
          <Navigation />
        </MemoryRouter>
      );

      let dashboardLink = screen.queryByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).not.toHaveClass('active');

      unmount();

      renderWithRouter(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navigation />
        </MemoryRouter>
      );

      dashboardLink = screen.getByRole('link', { name: 'Dashboard' });
      expect(dashboardLink).toHaveClass('active');
    });
  });
});
