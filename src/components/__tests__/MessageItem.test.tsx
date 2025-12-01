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

  it('handles empty message content', () => {
    const emptyMessage: Message = {
      role: 'user',
      content: '',
      timestamp: '2025-01-01T12:00:00Z',
    };

    render(<MessageItem message={emptyMessage} index={0} />);

    expect(screen.getByText('user')).toBeInTheDocument();
    const pre = screen.getByTestId('message-0').querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toBe('');
  });

  it('handles very long message content', () => {
    const longContent = 'A'.repeat(10000);
    const longMessage: Message = {
      role: 'assistant',
      content: longContent,
      timestamp: '2025-01-01T12:00:00Z',
    };

    render(<MessageItem message={longMessage} index={0} />);

    expect(screen.getByText('assistant')).toBeInTheDocument();
    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  it('handles message with whitespace-only content', () => {
    const whitespaceMessage: Message = {
      role: 'user',
      content: '   \n\t  ',
      timestamp: '2025-01-01T12:00:00Z',
    };

    render(<MessageItem message={whitespaceMessage} index={0} />);

    expect(screen.getByText('user')).toBeInTheDocument();
    const pre = screen.getByTestId('message-0').querySelector('pre');
    expect(pre?.textContent).toBe('   \n\t  ');
  });

  it('handles message with special characters', () => {
    const specialCharMessage: Message = {
      role: 'assistant',
      content: '<script>alert("xss")</script> & "quotes"',
      timestamp: '2025-01-01T12:00:00Z',
    };

    render(<MessageItem message={specialCharMessage} index={0} />);

    expect(screen.getByText('assistant')).toBeInTheDocument();
    expect(screen.getByText(/alert/)).toBeInTheDocument();
  });

  it('handles invalid timestamp gracefully', () => {
    const invalidTimestampMessage: Message = {
      role: 'user',
      content: 'Test message',
      timestamp: 'invalid-date',
    };

    render(<MessageItem message={invalidTimestampMessage} index={0} />);

    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    // Should still render timestamp even if invalid
    const timestamp = screen
      .getByTestId('message-0')
      .querySelector('.message-item__timestamp');
    expect(timestamp).toBeInTheDocument();
  });
});
