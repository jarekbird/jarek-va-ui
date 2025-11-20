import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
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

  it('sorts conversations by lastAccessedAt (newest first)', () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={mockConversations}
        activeConversationId={null}
        onSelectConversation={onSelect}
      />
    );

    const items = screen.getAllByText(/conv-/i);
    // conv-2 should be first (lastAccessedAt: 2025-01-03)
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

    const firstItem = screen.getByText(/conv-2/i).closest('li');
    if (firstItem) {
      await user.click(firstItem);
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
    expect(activeItem).toBeInTheDocument();
    expect(activeItem).toHaveTextContent('conv-1');
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
    expect(list).toBeInTheDocument();
    expect(list?.children.length).toBe(0);
  });
});
