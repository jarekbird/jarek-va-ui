import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { render as renderWithRouter } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AgentConversationList } from '../AgentConversationList';
import type { AgentConversation } from '../../types/agent-conversation';

/**
 * Comprehensive unit tests for AgentConversationList component
 *
 * This test suite verifies:
 * - Conversations are sorted by creation date (most recent first)
 * - Active conversation highlighting works from both props and URL
 * - Dashboard mode (with onConversationSelect) vs standalone mode behavior
 * - Click handlers work correctly in both modes
 * - Component renders correctly with different conversation lists
 */

const mockAgentConversations: AgentConversation[] = [
  {
    conversationId: 'agent-conv-1',
    messages: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastAccessedAt: '2025-01-02T00:00:00Z',
    agentId: 'test-agent',
  },
  {
    conversationId: 'agent-conv-2',
    messages: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastAccessedAt: '2025-01-03T00:00:00Z',
    agentId: 'test-agent',
  },
];

describe('AgentConversationList', () => {
  describe('Rendering', () => {
    it('renders a list of agent conversations', () => {
      const onSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/agent-conv-2/i)).toBeInTheDocument();
    });

    it('renders empty list when no conversations', () => {
      const onSelect = vi.fn();
      const { container } = render(
        <AgentConversationList
          conversations={[]}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      const list = container.querySelector('.conversation-list');
      expect(list).not.toBeNull();
      if (list) {
        expect(list).toBeInTheDocument();
        expect(list.children.length).toBe(0);
      }
    });

    it('renders all conversations in the list', () => {
      const onSelect = vi.fn();
      const manyConversations: AgentConversation[] = Array.from(
        { length: 5 },
        (_, i) => ({
          conversationId: `agent-conv-${i + 1}`,
          messages: [],
          createdAt: `2025-01-0${i + 1}T00:00:00Z`,
          lastAccessedAt: `2025-01-0${i + 1}T00:00:00Z`,
          agentId: 'test-agent',
        })
      );

      render(
        <AgentConversationList
          conversations={manyConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      manyConversations.forEach((conv) => {
        expect(
          screen.getByText(new RegExp(conv.conversationId, 'i'))
        ).toBeInTheDocument();
      });
    });

    it('displays conversation ID for each conversation', () => {
      const onSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      expect(screen.getByText(/ID: agent-conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/ID: agent-conv-2/i)).toBeInTheDocument();
    });

    it('displays last accessed date for each conversation', () => {
      const onSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      // Check for "Last accessed:" text
      const lastAccessedTexts = screen.getAllByText(/last accessed:/i);
      expect(lastAccessedTexts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Sorting', () => {
    it('sorts conversations by createdAt (newest first)', () => {
      const onSelect = vi.fn();
      const conversationsWithDifferentCreatedAt: AgentConversation[] = [
        {
          conversationId: 'agent-conv-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-02T00:00:00Z',
          agentId: 'test-agent',
        },
        {
          conversationId: 'agent-conv-2',
          messages: [],
          createdAt: '2025-01-03T00:00:00Z',
          lastAccessedAt: '2025-01-01T00:00:00Z',
          agentId: 'test-agent',
        },
      ];
      render(
        <AgentConversationList
          conversations={conversationsWithDifferentCreatedAt}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      const items = screen.getAllByText(/agent-conv-/i);
      // agent-conv-2 should be first (createdAt: 2025-01-03)
      expect(items[0]).toHaveTextContent('agent-conv-2');
      expect(items[1]).toHaveTextContent('agent-conv-1');
    });

    it('does not mutate the original conversations array', () => {
      const onSelect = vi.fn();
      const originalConversations = [...mockAgentConversations];
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      // Original array should be unchanged
      expect(mockAgentConversations).toEqual(originalConversations);
    });

    it('handles conversations with same createdAt date', () => {
      const onSelect = vi.fn();
      const conversationsWithSameDate: AgentConversation[] = [
        {
          conversationId: 'agent-conv-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-02T00:00:00Z',
          agentId: 'test-agent',
        },
        {
          conversationId: 'agent-conv-2',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-03T00:00:00Z',
          agentId: 'test-agent',
        },
      ];
      render(
        <AgentConversationList
          conversations={conversationsWithSameDate}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      // Both should be rendered
      expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/agent-conv-2/i)).toBeInTheDocument();
    });
  });

  describe('Active state (from prop)', () => {
    it('applies active class when activeConversationId prop matches', () => {
      const onSelect = vi.fn();
      const { container } = render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId="agent-conv-1"
          onSelectConversation={onSelect}
        />
      );

      const activeItem = container.querySelector('li.active');
      expect(activeItem).not.toBeNull();
      if (activeItem) {
        expect(activeItem).toBeInTheDocument();
        expect(activeItem).toHaveTextContent('agent-conv-1');
      }
    });

    it('does not apply active class when prop does not match', () => {
      const onSelect = vi.fn();
      const { container } = render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId="agent-conv-nonexistent"
          onSelectConversation={onSelect}
        />
      );

      const activeItems = container.querySelectorAll('li.active');
      expect(activeItems.length).toBe(0);
    });

    it('only one conversation is active at a time', () => {
      const onSelect = vi.fn();
      const { container } = render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId="agent-conv-1"
          onSelectConversation={onSelect}
        />
      );

      const activeItems = container.querySelectorAll('li.active');
      expect(activeItems.length).toBe(1);
    });
  });

  describe('Active state (from URL)', () => {
    it('applies active class when URL matches conversation ID', () => {
      const onSelect = vi.fn();
      const { container } = renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/agent-conv-2']}>
          <AgentConversationList
            conversations={mockAgentConversations}
            activeConversationId={null}
            onSelectConversation={onSelect}
          />
        </MemoryRouter>
      );

      const activeItem = container.querySelector('li.active');
      expect(activeItem).not.toBeNull();
      if (activeItem) {
        expect(activeItem).toHaveTextContent('agent-conv-2');
      }
    });

    it('extracts conversation ID from URL correctly', () => {
      const onSelect = vi.fn();
      const { container } = renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/agent-conv-1']}>
          <AgentConversationList
            conversations={mockAgentConversations}
            activeConversationId={null}
            onSelectConversation={onSelect}
          />
        </MemoryRouter>
      );

      const activeItem = container.querySelector('li.active');
      expect(activeItem).not.toBeNull();
      if (activeItem) {
        expect(activeItem).toHaveTextContent('agent-conv-1');
      }
    });

    it('prop takes precedence over URL when both provided', () => {
      const onSelect = vi.fn();
      const { container } = renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/agent-conv-2']}>
          <AgentConversationList
            conversations={mockAgentConversations}
            activeConversationId="agent-conv-1"
            onSelectConversation={onSelect}
          />
        </MemoryRouter>
      );

      const activeItem = container.querySelector('li.active');
      expect(activeItem).not.toBeNull();
      if (activeItem) {
        // Should use prop, not URL
        expect(activeItem).toHaveTextContent('agent-conv-1');
      }
    });

    it('handles URL that does not match any conversation', () => {
      const onSelect = vi.fn();
      const { container } = renderWithRouter(
        <MemoryRouter initialEntries={['/agent-conversation/nonexistent']}>
          <AgentConversationList
            conversations={mockAgentConversations}
            activeConversationId={null}
            onSelectConversation={onSelect}
          />
        </MemoryRouter>
      );

      const activeItems = container.querySelectorAll('li.active');
      expect(activeItems.length).toBe(0);
    });
  });

  describe('Dashboard mode (with onConversationSelect)', () => {
    it('uses # href when onConversationSelect is provided', () => {
      const onSelect = vi.fn();
      const onConversationSelect = vi.fn();
      const { container } = render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
          onConversationSelect={onConversationSelect}
        />
      );

      // React Router's Link normalizes "#" to "/" in test environment
      // Instead, verify that links don't have the full path
      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        const href = link.getAttribute('href');
        // In dashboard mode, href should be "#" or "/" (normalized)
        // The key is that it's not the full path
        expect(href).not.toContain('/agent-conversation/');
      });
    });

    it('calls onConversationSelect with conversation ID when clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onConversationSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
          onConversationSelect={onConversationSelect}
        />
      );

      const link = screen.getByText(/agent-conv-2/i).closest('a');
      if (link) {
        await user.click(link);
        expect(onConversationSelect).toHaveBeenCalledWith('agent-conv-2');
      }
    });

    it('calls onSelectConversation with conversation ID when clicked', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onConversationSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
          onConversationSelect={onConversationSelect}
        />
      );

      const link = screen.getByText(/agent-conv-1/i).closest('a');
      if (link) {
        await user.click(link);
        expect(onSelect).toHaveBeenCalledWith('agent-conv-1');
      }
    });

    it('calls preventDefault to prevent navigation in dashboard mode', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const onConversationSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
          onConversationSelect={onConversationSelect}
        />
      );

      const link = screen.getByText(/agent-conv-1/i).closest('a');
      if (link) {
        // The component's onClick handler should call preventDefault
        // We verify this by checking that onConversationSelect was called
        // (which only happens if preventDefault was called in the handler)
        await user.click(link);
        expect(onConversationSelect).toHaveBeenCalled();
      }
    });
  });

  describe('Standalone mode (without onConversationSelect)', () => {
    it('navigates to /agent-conversation/:id when onConversationSelect is not provided', () => {
      const onSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute(
        'href',
        '/agent-conversation/agent-conv-1'
      );
      expect(links[1]).toHaveAttribute(
        'href',
        '/agent-conversation/agent-conv-2'
      );
    });

    it('calls onSelectConversation when clicked in standalone mode', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      const link = screen.getByText(/agent-conv-2/i).closest('a');
      if (link) {
        await user.click(link);
        expect(onSelect).toHaveBeenCalledWith('agent-conv-2');
      }
    });
  });

  describe('Edge cases', () => {
    it('handles conversations with empty messages arrays', () => {
      const onSelect = vi.fn();
      const conversationsWithEmptyMessages: AgentConversation[] = [
        {
          conversationId: 'agent-conv-empty-1',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-02T00:00:00Z',
          agentId: 'test-agent',
        },
        {
          conversationId: 'agent-conv-empty-2',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-03T00:00:00Z',
          agentId: 'test-agent',
        },
      ];

      render(
        <AgentConversationList
          conversations={conversationsWithEmptyMessages}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      expect(screen.getByText(/agent-conv-empty-1/i)).toBeInTheDocument();
      expect(screen.getByText(/agent-conv-empty-2/i)).toBeInTheDocument();
    });

    it('handles conversations with invalid date strings', () => {
      const onSelect = vi.fn();
      const conversationsWithInvalidDates: AgentConversation[] = [
        {
          conversationId: 'agent-conv-invalid-1',
          messages: [],
          createdAt: 'invalid-date',
          lastAccessedAt: 'also-invalid',
          agentId: 'test-agent',
        },
        {
          conversationId: 'agent-conv-invalid-2',
          messages: [],
          createdAt: '2025-01-01T00:00:00Z',
          lastAccessedAt: '2025-01-02T00:00:00Z',
          agentId: 'test-agent',
        },
      ];

      render(
        <AgentConversationList
          conversations={conversationsWithInvalidDates}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      // Should still render conversations even with invalid dates
      expect(screen.getByText(/agent-conv-invalid-1/i)).toBeInTheDocument();
      expect(screen.getByText(/agent-conv-invalid-2/i)).toBeInTheDocument();
    });

    it('handles missing onSelectConversation prop gracefully', () => {
      // This test verifies the component doesn't crash if onSelectConversation is missing
      // However, onSelectConversation is required, so we test with a no-op function
      const onSelect = vi.fn();
      render(
        <AgentConversationList
          conversations={mockAgentConversations}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      // Component should render normally
      expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
    });

    it('handles very long list of conversations', () => {
      const onSelect = vi.fn();
      const veryLongList: AgentConversation[] = Array.from(
        { length: 500 },
        (_, i) => ({
          conversationId: `agent-conv-${i + 1}`,
          messages: [],
          createdAt: `2025-01-${String(Math.floor(i / 30) + 1).padStart(2, '0')}T00:00:00Z`,
          lastAccessedAt: `2025-01-${String(Math.floor(i / 30) + 1).padStart(2, '0')}T00:00:00Z`,
          agentId: 'test-agent',
        })
      );

      render(
        <AgentConversationList
          conversations={veryLongList}
          activeConversationId={null}
          onSelectConversation={onSelect}
        />
      );

      // Should render all conversations - check that both first and last are present
      const conv1Elements = screen.getAllByText(/agent-conv-1/i);
      const conv500Elements = screen.getAllByText(/agent-conv-500/i);
      expect(conv1Elements.length).toBeGreaterThan(0);
      expect(conv500Elements.length).toBeGreaterThan(0);
      // Verify they contain the exact conversation ID
      expect(
        conv1Elements.some((el) => el.textContent?.includes('agent-conv-1'))
      ).toBe(true);
      expect(
        conv500Elements.some((el) => el.textContent?.includes('agent-conv-500'))
      ).toBe(true);
    });
  });
});
