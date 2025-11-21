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

    const userMessage = container.querySelector('.message.user');
    const assistantMessage = container.querySelector('.message.assistant');

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
});
