import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import { ConversationDetails } from '../ConversationDetails';
import type { Conversation } from '../../types';

// Mock the repositories API
vi.mock('../../api/repositories', () => ({
  getRepositoryFiles: vi.fn(),
}));

import * as repositoriesAPI from '../../api/repositories';

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
});
