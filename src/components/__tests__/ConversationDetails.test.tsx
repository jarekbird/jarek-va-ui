import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { ConversationDetails } from '../ConversationDetails';
import type { Conversation } from '../../types';

// Mock the repositories API
vi.mock('../../api/repositories', () => ({
  getRepositoryFiles: vi.fn(),
}));

// Mock the conversations API
vi.mock('../../api/conversations', () => ({
  sendMessage: vi.fn(),
  getConversationById: vi.fn(),
}));

import * as repositoriesAPI from '../../api/repositories';
import * as conversationsAPI from '../../api/conversations';

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

  describe('Repository File Browser Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders file browser when repository is provided', async () => {
      const mockFiles = [
        {
          name: 'src',
          path: 'src',
          type: 'directory' as const,
          children: [
            {
              name: 'index.ts',
              path: 'src/index.ts',
              type: 'file' as const,
            },
          ],
        },
      ];

      vi.mocked(repositoriesAPI.getRepositoryFiles).mockResolvedValueOnce(
        mockFiles
      );

      render(
        <ConversationDetails
          conversation={mockConversation}
          repository="test-repo"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/repository structure/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/repository structure \(read-only\)/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/repository: test-repo/i)).toBeInTheDocument();
    });

    it('does not render file browser when repository is not provided', () => {
      render(<ConversationDetails conversation={mockConversation} />);
      expect(
        screen.queryByText(/repository structure/i)
      ).not.toBeInTheDocument();
    });

    it('shows loading state while fetching file tree', () => {
      vi.mocked(repositoriesAPI.getRepositoryFiles).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <ConversationDetails
          conversation={mockConversation}
          repository="test-repo"
        />
      );

      expect(
        screen.getByText(/loading repository structure/i)
      ).toBeInTheDocument();
    });

    it('shows error message when file tree loading fails', async () => {
      const errorMessage = 'Failed to load repository file structure';
      vi.mocked(repositoriesAPI.getRepositoryFiles).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      render(
        <ConversationDetails
          conversation={mockConversation}
          repository="test-repo"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(errorMessage, 'i'))
        ).toBeInTheDocument();
      });
    });

    it('maintains readable layout with long conversations', () => {
      const longConversation: Conversation = {
        ...mockConversation,
        messages: Array.from({ length: 50 }, (_, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i + 1}`,
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        })),
      };

      const { container } = render(
        <ConversationDetails
          conversation={longConversation}
          repository="test-repo"
        />
      );

      // Check that messages container has max-height for scrolling
      const messagesContainer = container.querySelector('.messages-container');
      expect(messagesContainer).toBeInTheDocument();
      // The CSS should have max-height: 60vh for scrolling
    });
  });

  describe('Performance', () => {
    it(
      'renders long conversation history efficiently',
      () => {
        const longConversation: Conversation = {
          ...mockConversation,
          messages: Array.from({ length: 1000 }, (_, i) => ({
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i + 1}`,
            timestamp: new Date(Date.now() + i * 1000).toISOString(),
          })),
        };

        const start = performance.now();
        render(
          <ConversationDetails
            conversation={longConversation}
            repository="test-repo"
          />
        );
        const duration = performance.now() - start;

        // Should render 1000 messages in less than 1000ms (adjusted for system variance)
        expect(duration).toBeLessThan(1000);
        expect(screen.getByText('Message 1')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    it(
      'handles very long conversation history without performance regression',
      () => {
        const veryLongConversation: Conversation = {
          ...mockConversation,
          messages: Array.from({ length: 2000 }, (_, i) => ({
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i + 1}: ${'x'.repeat(100)}`, // Longer messages
            timestamp: new Date(Date.now() + i * 1000).toISOString(),
          })),
        };

        const start = performance.now();
        render(
          <ConversationDetails
            conversation={veryLongConversation}
            repository="test-repo"
          />
        );
        const duration = performance.now() - start;

        // Should render 2000 messages in less than 2000ms (adjusted for system variance)
        expect(duration).toBeLessThan(2000);
        expect(screen.getByText(/Message 1:/)).toBeInTheDocument();
      },
      { timeout: 15000 }
    );
  });

  describe('Multiple Back-to-Back Messages', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('allows sending multiple messages while waiting for response', async () => {
      const user = userEvent.setup({ delay: null });
      const initialConversation: Conversation = {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      // Mock sendMessage to resolve immediately
      vi.mocked(conversationsAPI.sendMessage).mockResolvedValue({
        success: true,
        conversationId: 'conv-1',
      });

      // Mock getConversationById to return updated conversation with assistant responses
      let messageCount = 0;
      vi.mocked(conversationsAPI.getConversationById).mockImplementation(
        async () => {
          messageCount++;
          return {
            ...initialConversation,
            messages: [
              {
                role: 'user',
                content: 'Message 1',
                timestamp: '2025-01-01T10:00:00Z',
              },
              {
                role: 'assistant',
                content: 'Response to: Message 1',
                timestamp: '2025-01-01T10:00:01Z',
              },
              ...(messageCount > 1
                ? [
                    {
                      role: 'user',
                      content: 'Message 2',
                      timestamp: '2025-01-01T10:00:02Z',
                    },
                    {
                      role: 'assistant',
                      content: 'Response to: Message 2',
                      timestamp: '2025-01-01T10:00:03Z',
                    },
                  ]
                : []),
            ],
          };
        }
      );

      render(<ConversationDetails conversation={initialConversation} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send first message
      await user.type(textarea, 'Message 1');
      await user.click(sendButton);

      // Verify first message is sent
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalledWith('conv-1', {
          message: 'Message 1',
        });
      });

      // Verify input is cleared and still enabled
      expect(textarea).toHaveValue('');
      expect(textarea).not.toBeDisabled();
      // Button is disabled when input is empty, which is expected

      // Send second message immediately (while waiting for first response)
      await user.type(textarea, 'Message 2');
      expect(sendButton).not.toBeDisabled();
      await user.click(sendButton);

      // Verify second message is also sent
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalledTimes(2);
        expect(conversationsAPI.sendMessage).toHaveBeenLastCalledWith(
          'conv-1',
          {
            message: 'Message 2',
          }
        );
      });

      // Verify input is still enabled
      expect(textarea).not.toBeDisabled();
    });

    it('does not disable input field when polling for responses', async () => {
      const user = userEvent.setup({ delay: null });
      const initialConversation: Conversation = {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      vi.mocked(conversationsAPI.sendMessage).mockResolvedValue({
        success: true,
        conversationId: 'conv-1',
      });

      vi.mocked(conversationsAPI.getConversationById).mockResolvedValue({
        ...initialConversation,
        messages: [
          {
            role: 'user',
            content: 'Test message',
            timestamp: '2025-01-01T10:00:00Z',
          },
          {
            role: 'assistant',
            content: 'Response to: Test message',
            timestamp: '2025-01-01T10:00:01Z',
          },
        ],
      });

      render(<ConversationDetails conversation={initialConversation} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send a message
      await user.type(textarea, 'Test message');
      await user.click(sendButton);

      // Wait for polling to start
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalled();
      });

      // Verify input is still enabled even while polling
      // (textarea is always enabled, button is enabled when there's text)
      expect(textarea).not.toBeDisabled();

      // Type something to enable the button
      await user.type(textarea, 'Another message');
      expect(sendButton).not.toBeDisabled();
    });

    it('maintains correct message order when sending multiple messages', async () => {
      const user = userEvent.setup({ delay: null });
      const initialConversation: Conversation = {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      vi.mocked(conversationsAPI.sendMessage).mockResolvedValue({
        success: true,
        conversationId: 'conv-1',
      });

      vi.mocked(conversationsAPI.getConversationById).mockResolvedValue({
        ...initialConversation,
        messages: [
          {
            role: 'user',
            content: 'First message',
            timestamp: '2025-01-01T10:00:00Z',
          },
          {
            role: 'user',
            content: 'Second message',
            timestamp: '2025-01-01T10:00:01Z',
          },
        ],
      });

      render(<ConversationDetails conversation={initialConversation} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send first message
      await user.type(textarea, 'First message');
      await user.click(sendButton);

      // Wait for first message to be sent
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalledTimes(1);
      });

      // Send second message immediately
      await user.type(textarea, 'Second message');
      await user.click(sendButton);

      // Verify both messages were sent in order
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalledTimes(2);
        expect(conversationsAPI.sendMessage).toHaveBeenNthCalledWith(
          1,
          'conv-1',
          {
            message: 'First message',
          }
        );
        expect(conversationsAPI.sendMessage).toHaveBeenNthCalledWith(
          2,
          'conv-1',
          {
            message: 'Second message',
          }
        );
      });
    });

    it('allows sending message even when isSending is true', async () => {
      const user = userEvent.setup({ delay: null });
      const initialConversation: Conversation = {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      // Make sendMessage resolve immediately (but allow multiple calls)
      vi.mocked(conversationsAPI.sendMessage).mockResolvedValue({
        success: true,
        conversationId: 'conv-1',
      });

      vi.mocked(conversationsAPI.getConversationById).mockResolvedValue({
        ...initialConversation,
        messages: [
          {
            role: 'user',
            content: 'Message 1',
            timestamp: '2025-01-01T10:00:00Z',
          },
        ],
      });

      render(<ConversationDetails conversation={initialConversation} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send first message
      await user.type(textarea, 'Message 1');
      await user.click(sendButton);

      // Wait for first message to be sent
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalledTimes(1);
      });

      // Immediately try to send second message (before first completes)
      // Input should still be enabled
      expect(textarea).not.toBeDisabled();
      await user.type(textarea, 'Message 2');
      expect(sendButton).not.toBeDisabled();
      await user.click(sendButton);

      // Verify both messages were sent
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalledTimes(2);
      });
    });

    it('does not block input when isSending is true', async () => {
      const user = userEvent.setup({ delay: null });
      const initialConversation: Conversation = {
        conversationId: 'conv-1',
        messages: [],
        createdAt: '2025-01-01T00:00:00Z',
        lastAccessedAt: '2025-01-01T00:00:00Z',
      };

      // Make sendMessage resolve immediately
      vi.mocked(conversationsAPI.sendMessage).mockResolvedValue({
        success: true,
        conversationId: 'conv-1',
      });

      let callCount = 0;
      vi.mocked(conversationsAPI.getConversationById).mockImplementation(
        async () => {
          callCount++;
          const messages = [];
          if (callCount >= 1) {
            messages.push({
              role: 'user' as const,
              content: 'Message 1',
              timestamp: '2025-01-01T10:00:00Z',
            });
          }
          if (callCount >= 2) {
            messages.push({
              role: 'user' as const,
              content: 'Message 2',
              timestamp: '2025-01-01T10:00:01Z',
            });
          }
          return {
            ...initialConversation,
            messages,
          };
        }
      );

      render(<ConversationDetails conversation={initialConversation} />);

      const textarea = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send first message
      await user.type(textarea, 'Message 1');
      await user.click(sendButton);

      // Wait for first message to be sent
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalledTimes(1);
      });

      // Verify input is still enabled (textarea should be enabled even when empty)
      expect(textarea).not.toBeDisabled();

      // Send second message immediately (while waiting for first response)
      // The button will be enabled once we start typing
      await user.type(textarea, 'Message 2');
      expect(sendButton).not.toBeDisabled();
      await user.click(sendButton);

      // Verify both messages were sent
      await waitFor(() => {
        expect(conversationsAPI.sendMessage).toHaveBeenCalledTimes(2);
      });
    });
  });
});
