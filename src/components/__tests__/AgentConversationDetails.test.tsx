import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { AgentConversationDetails } from '../AgentConversationDetails';
import type { AgentConversation } from '../../types/agent-conversation';

// Mock the agent conversations API
vi.mock('../../api/agent-conversations', () => ({
  sendAgentMessage: vi.fn(),
  getAgentConversation: vi.fn(),
}));

import * as agentConversationsAPI from '../../api/agent-conversations';

const mockAgentConversation: AgentConversation = {
  conversationId: 'agent-conv-1',
  messages: [
    {
      role: 'user',
      content: 'Hello agent',
      timestamp: '2025-01-01T10:00:00Z',
      source: 'text',
    },
    {
      role: 'assistant',
      content: 'Hello! How can I help you?',
      timestamp: '2025-01-01T10:00:01Z',
      source: 'voice',
    },
  ],
  createdAt: '2025-01-01T00:00:00Z',
  lastAccessedAt: '2025-01-01T10:00:01Z',
};

describe('AgentConversationDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when conversation is null', () => {
    const { container } = render(
      <AgentConversationDetails conversation={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders conversation ID', () => {
    render(<AgentConversationDetails conversation={mockAgentConversation} />);
    expect(screen.getByText(/agent-conv-1/i)).toBeInTheDocument();
  });

  it('renders all messages', () => {
    render(<AgentConversationDetails conversation={mockAgentConversation} />);
    expect(screen.getByText('Hello agent')).toBeInTheDocument();
    expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument();
  });

  it('renders message roles', () => {
    render(<AgentConversationDetails conversation={mockAgentConversation} />);
    // Roles are rendered as "👤 You" and "🤖 Assistant"
    // Use getAllByText since these appear in both messages and metadata
    expect(screen.getAllByText(/you/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/assistant/i).length).toBeGreaterThan(0);
  });

  it('renders message sources', () => {
    render(<AgentConversationDetails conversation={mockAgentConversation} />);
    // Sources are rendered with emojis: "⌨️ text" and "🎤 voice"
    expect(screen.getByText(/text/i)).toBeInTheDocument();
    expect(screen.getByText(/voice/i)).toBeInTheDocument();
  });

  it('renders timestamps', () => {
    render(<AgentConversationDetails conversation={mockAgentConversation} />);
    const timestamps = screen.getAllByText(/2025/i);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('renders message input form', () => {
    render(<AgentConversationDetails conversation={mockAgentConversation} />);
    expect(
      screen.getByPlaceholderText(/type your message/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('allows typing in message input', async () => {
    const user = userEvent.setup();
    render(<AgentConversationDetails conversation={mockAgentConversation} />);
    const input = screen.getByPlaceholderText(
      /type your message/i
    ) as HTMLInputElement;

    await user.type(input, 'Test message');

    expect(input.value).toBe('Test message');
  });

  it('sends message on form submit', async () => {
    const user = userEvent.setup();
    vi.mocked(agentConversationsAPI.sendAgentMessage).mockResolvedValueOnce({
      success: true,
      message: 'Message sent',
    });
    vi.mocked(agentConversationsAPI.getAgentConversation).mockResolvedValueOnce(
      {
        ...mockAgentConversation,
        messages: [
          ...mockAgentConversation.messages,
          {
            role: 'user',
            content: 'New message',
            timestamp: new Date().toISOString(),
            source: 'text',
          },
        ],
      }
    );

    const onConversationUpdate = vi.fn();
    render(
      <AgentConversationDetails
        conversation={mockAgentConversation}
        onConversationUpdate={onConversationUpdate}
      />
    );

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'New message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(agentConversationsAPI.sendAgentMessage).toHaveBeenCalledWith(
        'agent-conv-1',
        expect.objectContaining({
          role: 'user',
          content: 'New message',
          source: 'text',
        })
      );
    });

    // Optimistic update should be called
    expect(onConversationUpdate).toHaveBeenCalled();
  });

  it('shows error message when sending fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to send message';
    vi.mocked(agentConversationsAPI.sendAgentMessage).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    render(<AgentConversationDetails conversation={mockAgentConversation} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(errorMessage, 'i'))
      ).toBeInTheDocument();
    });
  });

  it('disables send button while sending', async () => {
    const user = userEvent.setup();
    vi.mocked(agentConversationsAPI.sendAgentMessage).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AgentConversationDetails conversation={mockAgentConversation} />);

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    // Button should be disabled while sending
    expect(sendButton).toBeDisabled();
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    vi.mocked(agentConversationsAPI.sendAgentMessage).mockResolvedValueOnce({
      success: true,
      message: 'Message sent',
    });
    vi.mocked(agentConversationsAPI.getAgentConversation).mockResolvedValueOnce(
      mockAgentConversation
    );

    render(<AgentConversationDetails conversation={mockAgentConversation} />);

    const input = screen.getByPlaceholderText(
      /type your message/i
    ) as HTMLInputElement;
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('renders tool information when present', () => {
    const conversationWithTools: AgentConversation = {
      ...mockAgentConversation,
      messages: [
        ...mockAgentConversation.messages,
        {
          role: 'assistant',
          content: 'Tool execution result',
          timestamp: '2025-01-01T10:00:02Z',
          source: 'text',
          toolName: 'execute_command',
          toolArgs: { command: 'ls -la' },
          toolOutput: 'file1.txt\nfile2.txt',
        },
      ],
    };

    render(<AgentConversationDetails conversation={conversationWithTools} />);

    expect(screen.getByText(/execute_command/i)).toBeInTheDocument();
    expect(screen.getByText(/ls -la/i)).toBeInTheDocument();
    expect(screen.getByText(/file1.txt/i)).toBeInTheDocument();
  });

  it('renders export conversation button', () => {
    render(<AgentConversationDetails conversation={mockAgentConversation} />);
    // Export button has emoji and text "📥 Export"
    expect(screen.getByText(/export/i)).toBeInTheDocument();
  });

  it('maintains readable layout with long conversation history', () => {
    const longConversation: AgentConversation = {
      ...mockAgentConversation,
      messages: Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i + 1}`,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
        source: i % 2 === 0 ? 'text' : 'voice',
      })),
    };

    const { container } = render(
      <AgentConversationDetails conversation={longConversation} />
    );

    // Check that messages container exists and is scrollable
    const messagesContainer = container.querySelector('.messages-container');
    expect(messagesContainer).toBeInTheDocument();

    // All messages should be rendered
    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Message 100')).toBeInTheDocument();
  });

  describe('Performance', () => {
    it('renders long conversation history efficiently', () => {
      const longConversation: AgentConversation = {
        ...mockAgentConversation,
        messages: Array.from({ length: 1000 }, (_, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i + 1}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
          source: i % 2 === 0 ? 'text' : 'voice',
        })),
      };

      const start = performance.now();
      render(<AgentConversationDetails conversation={longConversation} />);
      const duration = performance.now() - start;

      // Should render 1000 messages in less than 500ms
      expect(duration).toBeLessThan(500);
      expect(screen.getByText('Message 1')).toBeInTheDocument();
    });
  });
});
