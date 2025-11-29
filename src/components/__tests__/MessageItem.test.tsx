import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { MessageItem } from '../MessageItem';
import type { Message } from '../../types';

describe('MessageItem', () => {
  const mockUserMessage: Message = {
    role: 'user',
    content: 'Hello, how are you?',
    timestamp: '2025-01-01T12:00:00Z',
  };

  const mockAssistantMessage: Message = {
    role: 'assistant',
    content: 'I am doing well, thank you!',
    timestamp: '2025-01-01T12:00:01Z',
  };

  it('renders user message correctly', () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByTestId('message-0')).toHaveClass('message-item--user');
  });

  it('renders assistant message correctly', () => {
    render(<MessageItem message={mockAssistantMessage} index={1} />);

    expect(screen.getByText('assistant')).toBeInTheDocument();
    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
    expect(screen.getByTestId('message-1')).toHaveClass(
      'message-item--assistant'
    );
  });

  it('formats timestamp correctly', () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    const timestamp = screen.getByText(/2025/);
    expect(timestamp).toBeInTheDocument();
  });

  it('renders message content in pre tag', () => {
    render(<MessageItem message={mockUserMessage} index={0} />);

    const pre = screen.getByText('Hello, how are you?').closest('pre');
    expect(pre).toBeInTheDocument();
  });
});
