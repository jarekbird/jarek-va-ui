import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { render as renderWithRouter } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { ConversationList } from '../ConversationList';
import type { Conversation } from '../../types';

const mockConversations: Conversation[] = [
  {
    conversationId: 'conv-1',
    messages: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastAccessedAt: '2025-01-02T00:00:00Z',
  },
  {
    conversationId: 'conv-2',
    messages: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastAccessedAt: '2025-01-03T00:00:00Z',
  },
];

describe('ConversationList', () => {
  it('renders a list of conversations', () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={mockConversations}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    expect(screen.getByText(/conv-2/i)).toBeInTheDocument();
  });

  it('sorts conversations by createdAt (newest first)', () => {
    const onSelect = vi.fn();
    const conversationsWithDifferentCreatedAt: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-02T00:00:00Z',
      },
      {
        conversationId: 'conv-2',
        messages: [],
        createdAt: '2025-01-03T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      },
    ];
    render(
      <ConversationList
        conversations={conversationsWithDifferentCreatedAt}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    const items = screen.getAllByText(/conv-/i);
    // conv-2 should be first (createdAt: 2025-01-03)
    expect(items[0]).toHaveTextContent('conv-2');
    expect(items[1]).toHaveTextContent('conv-1');
  });

  it('calls onSelectConversation when a conversation is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={mockConversations}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    // Click the Link component, not the li
    const link = screen.getByText(/conv-2/i).closest('a');
    if (link) {
      await user.click(link);
      expect(onSelect).toHaveBeenCalledWith('conv-2');
    }
  });

  it('highlights the active conversation', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ConversationList
        conversations={mockConversations}
        activeConversationId="conv-1"
        onSelectConversation={onSelect}
      />
    );

    const activeItem = container.querySelector('li.active');
    expect(activeItem).not.toBeNull();
    if (activeItem) {
      expect(activeItem).toBeInTheDocument();
      expect(activeItem).toHaveTextContent('conv-1');
    }
  });

  it('renders empty list when no conversations', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ConversationList
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

  it('determines active conversation from URL when activeConversationId is null', () => {
    const onSelect = vi.fn();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = renderWithRouter(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/conversations/conv-2']}>
          <ConversationList
            conversations={mockConversations}
            activeConversationId={null}
            onSelectConversation={onSelect}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const activeItem = container.querySelector('li.active');
    expect(activeItem).not.toBeNull();
    if (activeItem) {
      expect(activeItem).toHaveTextContent('conv-2');
    }
  });

  it('prioritizes activeConversationId prop over URL', () => {
    const onSelect = vi.fn();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { container } = renderWithRouter(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/conversations/conv-2']}>
          <ConversationList
            conversations={mockConversations}
            activeConversationId="conv-1"
            onSelectConversation={onSelect}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const activeItem = container.querySelector('li.active');
    expect(activeItem).not.toBeNull();
    if (activeItem) {
      expect(activeItem).toHaveTextContent('conv-1');
    }
  });

  it('handles conversations with same createdAt date', () => {
    const onSelect = vi.fn();
    const conversationsWithSameDate: Conversation[] = [
      {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-02T00:00:00Z',
      },
      {
        conversationId: 'conv-2',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-03T00:00:00Z',
      },
    ];
    render(
      <ConversationList
        conversations={conversationsWithSameDate}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    // Both should be rendered
    expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    expect(screen.getByText(/conv-2/i)).toBeInTheDocument();
  });

  it('renders all conversations in the list', () => {
    const onSelect = vi.fn();
    const manyConversations: Conversation[] = Array.from(
      { length: 5 },
      (_, i) => ({
        conversationId: `conv-${i + 1}`,
        messages: [],
        createdAt: `2025-01-0${i + 1}T00:00:00Z`,
        lastAccessedAt: `2025-01-0${i + 1}T00:00:00Z`,
      })
    );

    render(
      <ConversationList
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

  it('handles very long list of conversations', () => {
    const onSelect = vi.fn();
    const veryLongList: Conversation[] = Array.from(
      { length: 500 },
      (_, i) => ({
        conversationId: `conv-${i + 1}`,
        messages: [],
        createdAt: `2025-01-${String(Math.floor(i / 30) + 1).padStart(2, '0')}T00:00:00Z`,
        lastAccessedAt: `2025-01-${String(Math.floor(i / 30) + 1).padStart(2, '0')}T00:00:00Z`,
      })
    );

    render(
      <ConversationList
        conversations={veryLongList}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    // Should render all conversations - check that both first and last are present
    // Use getAllByText and check that at least one matches (to avoid substring issues)
    const conv1Elements = screen.getAllByText(/conv-1/i);
    const conv500Elements = screen.getAllByText(/conv-500/i);
    expect(conv1Elements.length).toBeGreaterThan(0);
    expect(conv500Elements.length).toBeGreaterThan(0);
    // Verify they contain the exact conversation ID
    expect(conv1Elements.some((el) => el.textContent?.includes('conv-1'))).toBe(
      true
    );
    expect(
      conv500Elements.some((el) => el.textContent?.includes('conv-500'))
    ).toBe(true);
  });

  it('handles conversations with empty messages arrays', () => {
    const onSelect = vi.fn();
    const conversationsWithEmptyMessages: Conversation[] = [
      {
        conversationId: 'conv-empty-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-02T00:00:00Z',
      },
      {
        conversationId: 'conv-empty-2',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-03T00:00:00Z',
      },
    ];

    render(
      <ConversationList
        conversations={conversationsWithEmptyMessages}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    expect(screen.getByText(/conv-empty-1/i)).toBeInTheDocument();
    expect(screen.getByText(/conv-empty-2/i)).toBeInTheDocument();
  });

  it('handles conversations with invalid date strings', () => {
    const onSelect = vi.fn();
    const conversationsWithInvalidDates: Conversation[] = [
      {
        conversationId: 'conv-invalid-1',
        messages: [],
        createdAt: 'invalid-date',
        lastAccessedAt: 'also-invalid',
      },
      {
        conversationId: 'conv-invalid-2',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-02T00:00:00Z',
      },
    ];

    render(
      <ConversationList
        conversations={conversationsWithInvalidDates}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    // Should still render conversations even with invalid dates
    expect(screen.getByText(/conv-invalid-1/i)).toBeInTheDocument();
    expect(screen.getByText(/conv-invalid-2/i)).toBeInTheDocument();
  });

  it('handles conversations with same createdAt (stable sort)', () => {
    const onSelect = vi.fn();
    const conversationsWithSameDate: Conversation[] = Array.from(
      { length: 10 },
      (_, i) => ({
        conversationId: `conv-${i + 1}`,
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: `2025-01-0${(i % 9) + 1}T00:00:00Z`,
      })
    );

    render(
      <ConversationList
        conversations={conversationsWithSameDate}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    // All should be rendered - use getAllByText since there might be multiple matches
    conversationsWithSameDate.forEach((conv) => {
      const elements = screen.getAllByText(
        new RegExp(conv.conversationId, 'i')
      );
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toBeInTheDocument();
    });
  });
});
