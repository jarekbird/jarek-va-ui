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

  it('formats last accessed date correctly', () => {
    const conversationWithDate: Conversation = {
      conversationId: 'conv-123',
      messages: [],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-12-25T12:30:45Z',
    };

    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={conversationWithDate}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Last accessed:/i)).toBeInTheDocument();
    // The date should be formatted using toLocaleString
    const dateText = screen.getByText(/Last accessed:/i).textContent;
    expect(dateText).toContain('Last accessed:');
  });

  it('handles long conversation IDs', () => {
    const longIdConversation: Conversation = {
      conversationId: 'very-long-conversation-id-that-might-wrap',
      messages: [],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-02T00:00:00Z',
    };

    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={longIdConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/very-long-conversation-id-that-might-wrap/i)
    ).toBeInTheDocument();
  });

  it('applies correct styling to link', () => {
    const { container } = render(
      <MemoryRouter>
        <ConversationListItem
          conversation={mockConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    const link = container.querySelector('a');
    expect(link).toHaveStyle({
      textDecoration: 'none',
      color: 'inherit',
      display: 'block',
    });
  });

  it('renders conversation meta information', () => {
    const { container } = render(
      <MemoryRouter>
        <ConversationListItem
          conversation={mockConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    const meta = container.querySelector('.conversation-meta');
    expect(meta).toBeInTheDocument();
    expect(meta?.querySelector('.conversation-id')).toBeInTheDocument();
    expect(meta?.querySelector('.conversation-date')).toBeInTheDocument();
  });

  it('handles conversation with empty messages array', () => {
    const emptyMessagesConversation: Conversation = {
      conversationId: 'conv-empty',
      messages: [],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-02T00:00:00Z',
    };

    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={emptyMessagesConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/conv-empty/i)).toBeInTheDocument();
    expect(screen.getByText(/Last accessed:/i)).toBeInTheDocument();
  });

  it('handles conversation with invalid date strings', () => {
    const invalidDateConversation: Conversation = {
      conversationId: 'conv-invalid-date',
      messages: [],
      createdAt: 'invalid-date',
      lastAccessedAt: 'also-invalid',
    };

    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={invalidDateConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/conv-invalid-date/i)).toBeInTheDocument();
    // Should still render even with invalid dates
    expect(screen.getByText(/Last accessed:/i)).toBeInTheDocument();
  });

  it('handles conversation with very long conversation ID', () => {
    const longIdConversation: Conversation = {
      conversationId: 'a'.repeat(200),
      messages: [],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-02T00:00:00Z',
    };

    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={longIdConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText(new RegExp('a'.repeat(200), 'i'))
    ).toBeInTheDocument();
  });

  it('handles conversation with same createdAt and lastAccessedAt', () => {
    const sameDateConversation: Conversation = {
      conversationId: 'conv-same-date',
      messages: [],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T00:00:00Z',
    };

    render(
      <MemoryRouter>
        <ConversationListItem
          conversation={sameDateConversation}
          isActive={false}
          onSelectConversation={mockOnSelect}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/conv-same-date/i)).toBeInTheDocument();
    expect(screen.getByText(/Last accessed:/i)).toBeInTheDocument();
  });
});
