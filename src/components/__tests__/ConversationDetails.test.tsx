import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { ConversationDetails } from '../ConversationDetails';
import type { Conversation } from '../../types';

const mockConversation: Conversation = {
  conversationId: 'conv-1',
  messages: [
    {
      role: 'user',
      content: 'Hello, how are you?',
      timestamp: '2025-01-01T10:00:00Z',
    },
    {
      role: 'assistant',
      content: 'I am doing well, thank you!',
      timestamp: '2025-01-01T10:00:01Z',
    },
  ],
  createdAt: '2025-01-01T00:00:00Z',
  lastAccessedAt: '2025-01-01T10:00:01Z',
};

describe('ConversationDetails', () => {
  it('renders nothing when conversation is null', () => {
    const { container } = render(<ConversationDetails conversation={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders conversation ID', () => {
    render(<ConversationDetails conversation={mockConversation} />);
    expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
  });

  it('renders all messages', () => {
    render(<ConversationDetails conversation={mockConversation} />);
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
  });

  it('renders message roles', () => {
    render(<ConversationDetails conversation={mockConversation} />);
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('assistant')).toBeInTheDocument();
  });

  it('applies correct CSS classes for user and assistant messages', () => {
    const { container } = render(
      <ConversationDetails conversation={mockConversation} />
    );

    const userMessage = container.querySelector('.message-item--user');
    const assistantMessage = container.querySelector(
      '.message-item--assistant'
    );

    expect(userMessage).not.toBeNull();
    expect(assistantMessage).not.toBeNull();
    if (userMessage) {
      expect(userMessage).toBeInTheDocument();
    }
    if (assistantMessage) {
      expect(assistantMessage).toBeInTheDocument();
    }
  });

  it('renders timestamps', () => {
    render(<ConversationDetails conversation={mockConversation} />);
    // Timestamps are formatted, so we check for parts of the date
    // There are multiple timestamps, so use getAllByText
    const timestamps = screen.getAllByText(/2025/i);
    expect(timestamps.length).toBeGreaterThan(0);
    expect(timestamps[0]).toBeInTheDocument();
  });

  it('handles conversation with empty messages array', () => {
    const emptyConversation: Conversation = {
      conversationId: 'conv-empty',
      messages: [],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T00:00:00Z',
    };

    render(<ConversationDetails conversation={emptyConversation} />);

    expect(screen.getByText(/conv-empty/i)).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
  });

  it('handles conversation with messages containing empty content', () => {
    const conversationWithEmptyMessages: Conversation = {
      conversationId: 'conv-empty-msgs',
      messages: [
        {
          role: 'user',
          content: '',
          timestamp: '2025-01-01T10:00:00Z',
        },
        {
          role: 'assistant',
          content: '',
          timestamp: '2025-01-01T10:00:01Z',
        },
      ],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T10:00:01Z',
    };

    render(
      <ConversationDetails conversation={conversationWithEmptyMessages} />
    );

    expect(screen.getByText(/conv-empty-msgs/i)).toBeInTheDocument();
    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-1')).toBeInTheDocument();
  });

  it('handles long conversation with many messages', () => {
    const longConversation: Conversation = {
      conversationId: 'conv-long',
      messages: Array.from({ length: 150 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}`,
        timestamp: `2025-01-01T10:00:${String(i % 60).padStart(2, '0')}Z`,
      })),
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T10:05:00Z',
    };

    render(<ConversationDetails conversation={longConversation} />);

    expect(screen.getByText(/conv-long/i)).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-149')).toBeInTheDocument();
  });

  it('handles missing optional props (title, user, status)', () => {
    render(<ConversationDetails conversation={mockConversation} />);

    expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    // Should not crash when optional props are missing
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
  });

  it('handles conversation with all optional props provided', () => {
    render(
      <ConversationDetails
        conversation={mockConversation}
        title="Custom Title"
        user="test@example.com"
        status="active"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('handles conversation with mixed empty and non-empty messages', () => {
    const mixedConversation: Conversation = {
      conversationId: 'conv-mixed',
      messages: [
        {
          role: 'user',
          content: 'Hello',
          timestamp: '2025-01-01T10:00:00Z',
        },
        {
          role: 'assistant',
          content: '',
          timestamp: '2025-01-01T10:00:01Z',
        },
        {
          role: 'user',
          content: '   ',
          timestamp: '2025-01-01T10:00:02Z',
        },
        {
          role: 'assistant',
          content: 'Response',
          timestamp: '2025-01-01T10:00:03Z',
        },
      ],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T10:00:03Z',
    };

    render(<ConversationDetails conversation={mixedConversation} />);

    expect(screen.getByText(/conv-mixed/i)).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Response')).toBeInTheDocument();
  });
});
