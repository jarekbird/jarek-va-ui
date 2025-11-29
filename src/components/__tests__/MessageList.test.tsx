import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { MessageList } from '../MessageList';
import type { Message } from '../../types';

describe('MessageList', () => {
  const mockMessages: Message[] = [
    {
      role: 'user',
      content: 'Hello',
      timestamp: '2025-01-01T12:00:00Z',
    },
    {
      role: 'assistant',
      content: 'Hi there!',
      timestamp: '2025-01-01T12:00:01Z',
    },
  ];

  it('renders list of messages', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('renders empty list when no messages', () => {
    render(<MessageList messages={[]} />);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('shows typing indicator when polling', () => {
    render(<MessageList messages={mockMessages} isPolling={true} />);

    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('does not show typing indicator when not polling', () => {
    render(<MessageList messages={mockMessages} isPolling={false} />);

    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('renders all messages with correct indices', () => {
    render(<MessageList messages={mockMessages} />);

    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-1')).toBeInTheDocument();
  });

  it('handles messages with empty content', () => {
    const messagesWithEmpty: Message[] = [
      {
        role: 'user',
        content: '',
        timestamp: '2025-01-01T12:00:00Z',
      },
      {
        role: 'assistant',
        content: 'Response',
        timestamp: '2025-01-01T12:00:01Z',
      },
    ];

    render(<MessageList messages={messagesWithEmpty} />);

    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByText('Response')).toBeInTheDocument();
  });

  it('handles long conversations with many messages', () => {
    const longConversation: Message[] = Array.from({ length: 200 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i + 1}`,
      timestamp: `2025-01-01T12:00:${String(i).padStart(2, '0')}Z`,
    }));

    render(<MessageList messages={longConversation} />);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-199')).toBeInTheDocument();
    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Message 200')).toBeInTheDocument();
  });

  it('handles very long conversation (1000+ messages)', () => {
    const veryLongConversation: Message[] = Array.from(
      { length: 1000 },
      (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}`,
        timestamp: `2025-01-01T12:00:${String(i % 60).padStart(2, '0')}Z`,
      })
    );

    render(<MessageList messages={veryLongConversation} />);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-999')).toBeInTheDocument();
  });

  it('handles messages with missing or invalid timestamps', () => {
    const messagesWithInvalidTimestamps: Message[] = [
      {
        role: 'user',
        content: 'Message 1',
        timestamp: 'invalid-date',
      },
      {
        role: 'assistant',
        content: 'Message 2',
        timestamp: '2025-01-01T12:00:00Z',
      },
    ];

    render(<MessageList messages={messagesWithInvalidTimestamps} />);

    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Message 2')).toBeInTheDocument();
  });

  it('handles mixed empty and non-empty messages', () => {
    const mixedMessages: Message[] = [
      {
        role: 'user',
        content: 'Hello',
        timestamp: '2025-01-01T12:00:00Z',
      },
      {
        role: 'assistant',
        content: '',
        timestamp: '2025-01-01T12:00:01Z',
      },
      {
        role: 'user',
        content: '   ',
        timestamp: '2025-01-01T12:00:02Z',
      },
      {
        role: 'assistant',
        content: 'Response',
        timestamp: '2025-01-01T12:00:03Z',
      },
    ];

    render(<MessageList messages={mixedMessages} />);

    expect(screen.getByTestId('message-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-2')).toBeInTheDocument();
    expect(screen.getByTestId('message-3')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Response')).toBeInTheDocument();
  });
});
