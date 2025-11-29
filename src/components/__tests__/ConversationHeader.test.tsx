import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { ConversationHeader } from '../ConversationHeader';
import type { Conversation } from '../../types';

describe('ConversationHeader', () => {
  const mockConversation: Conversation = {
    conversationId: 'conv-123',
    messages: [],
    createdAt: '2025-01-01T12:00:00Z',
    lastAccessedAt: '2025-01-01T13:00:00Z',
  };

  it('renders conversation ID as title when title not provided', () => {
    render(<ConversationHeader conversation={mockConversation} />);

    expect(screen.getByText('Conversation ID: conv-123')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(
      <ConversationHeader
        conversation={mockConversation}
        title="My Conversation"
      />
    );

    expect(screen.getByText('My Conversation')).toBeInTheDocument();
    expect(
      screen.queryByText('Conversation ID: conv-123')
    ).not.toBeInTheDocument();
  });

  it('renders user when provided', () => {
    render(
      <ConversationHeader
        conversation={mockConversation}
        user="john@example.com"
      />
    );

    expect(screen.getByText('User: john@example.com')).toBeInTheDocument();
  });

  it('does not render user section when user not provided', () => {
    render(<ConversationHeader conversation={mockConversation} />);

    expect(screen.queryByTestId('conversation-user')).not.toBeInTheDocument();
  });

  it('renders status when provided', () => {
    render(
      <ConversationHeader conversation={mockConversation} status="active" />
    );

    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByTestId('conversation-status')).toBeInTheDocument();
  });

  it('does not render status when not provided', () => {
    render(<ConversationHeader conversation={mockConversation} />);

    expect(screen.queryByTestId('conversation-status')).not.toBeInTheDocument();
  });

  it('renders created and last accessed timestamps', () => {
    render(<ConversationHeader conversation={mockConversation} />);

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Last Accessed:/)).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<ConversationHeader conversation={mockConversation} />);

    // Check that timestamps are formatted (should contain year 2025)
    const timestamps = screen.getAllByText(/2025/);
    expect(timestamps.length).toBeGreaterThan(0);
  });
});
