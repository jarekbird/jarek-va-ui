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

  it('handles missing optional metadata gracefully', () => {
    render(<ConversationHeader conversation={mockConversation} />);

    // Should render conversation ID as title when title is not provided
    expect(screen.getByText('Conversation ID: conv-123')).toBeInTheDocument();
    // Should not render user section
    expect(screen.queryByTestId('conversation-user')).not.toBeInTheDocument();
    // Should not render status
    expect(screen.queryByTestId('conversation-status')).not.toBeInTheDocument();
  });

  it('handles all optional metadata provided', () => {
    render(
      <ConversationHeader
        conversation={mockConversation}
        title="Custom Title"
        user="test@example.com"
        status="active"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('User: test@example.com')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('handles partial optional metadata (only title)', () => {
    render(
      <ConversationHeader conversation={mockConversation} title="Only Title" />
    );

    expect(screen.getByText('Only Title')).toBeInTheDocument();
    expect(screen.queryByTestId('conversation-user')).not.toBeInTheDocument();
    expect(screen.queryByTestId('conversation-status')).not.toBeInTheDocument();
  });

  it('handles partial optional metadata (only user)', () => {
    render(
      <ConversationHeader
        conversation={mockConversation}
        user="onlyuser@example.com"
      />
    );

    expect(screen.getByText('Conversation ID: conv-123')).toBeInTheDocument();
    expect(screen.getByText('User: onlyuser@example.com')).toBeInTheDocument();
    expect(screen.queryByTestId('conversation-status')).not.toBeInTheDocument();
  });

  it('handles partial optional metadata (only status)', () => {
    render(
      <ConversationHeader conversation={mockConversation} status="pending" />
    );

    expect(screen.getByText('Conversation ID: conv-123')).toBeInTheDocument();
    expect(screen.queryByTestId('conversation-user')).not.toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('handles empty string optional metadata', () => {
    render(
      <ConversationHeader
        conversation={mockConversation}
        title=""
        user=""
        status=""
      />
    );

    // Empty strings should be treated as falsy, so should fall back to defaults
    expect(screen.getByText('Conversation ID: conv-123')).toBeInTheDocument();
    // Empty strings are falsy in JS, so these should not render
    expect(screen.queryByTestId('conversation-user')).not.toBeInTheDocument();
    // Status with empty string should not render (falsy check)
    expect(screen.queryByTestId('conversation-status')).not.toBeInTheDocument();
  });

  it('handles invalid date strings in timestamps gracefully', () => {
    const conversationWithInvalidDates: Conversation = {
      conversationId: 'conv-invalid-dates',
      messages: [],
      createdAt: 'invalid-date',
      lastAccessedAt: 'also-invalid',
    };

    render(<ConversationHeader conversation={conversationWithInvalidDates} />);

    // Should still render the component even with invalid dates
    expect(screen.getByText(/conv-invalid-dates/i)).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Last Accessed:/)).toBeInTheDocument();
  });
});
