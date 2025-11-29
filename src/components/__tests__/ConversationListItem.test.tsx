import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ConversationListItem } from '../ConversationListItem';
import type { Conversation } from '../../types';

describe('ConversationListItem', () => {
  const mockConversation: Conversation = {
    conversationId: 'conv-123',
    messages: [],
    createdAt: '2025-01-01T00:00:00Z',
    lastAccessedAt: '2025-01-02T00:00:00Z',
  };

  const mockOnSelect = vi.fn();

  it('renders conversation ID and last accessed date', () => {
    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={mockConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/conv-123/i)).toBeInTheDocument();
    expect(screen.getByText(/Last accessed:/i)).toBeInTheDocument();
  });

  it('applies active class when isActive is true', () => {
    const { container } = render(
      <MemoryRouter>
        <ConversationListItem
          conversation={mockConversation}
          isActive={true}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    const listItem = container.querySelector('li');
    expect(listItem).toHaveClass('active');
  });

  it('does not apply active class when isActive is false', () => {
    const { container } = render(
      <MemoryRouter>
        <ConversationListItem
          conversation={mockConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    const listItem = container.querySelector('li');
    expect(listItem).not.toHaveClass('active');
  });

  it('calls onSelectConversation when link is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={mockConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    const link = screen.getByText(/conv-123/i).closest('a');
    if (link) {
      await user.click(link);
      expect(mockOnSelect).toHaveBeenCalledWith('conv-123');
    }
  });

  it('renders link with correct href', () => {
    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={mockConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/conversations/conv-123');
  });
});
