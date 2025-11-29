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
});
