import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as conversationsAPI from '../api/conversations';
import type { Conversation } from '../types';

// Mock the API module
vi.mock('../api/conversations');

describe('App', () => {
  const mockConversations: Conversation[] = [
    {
      conversationId: 'conv-1',
      messages: [
        {
          role: 'user',
          content: 'Hello',
          timestamp: '2025-01-01T00:00:00Z',
        },
      ],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T00:00:00Z',
    },
    {
      conversationId: 'conv-2',
      messages: [],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main heading', () => {
    vi.mocked(conversationsAPI.listConversations).mockResolvedValueOnce([]);
    render(<App />);
    expect(screen.getByText('Note Taking History')).toBeInTheDocument();
  });

  it('loads and displays conversations on mount', async () => {
    vi.mocked(conversationsAPI.listConversations).mockResolvedValueOnce(
      mockConversations
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/conv-2/i)).toBeInTheDocument();
    });
  });

  it('displays loading spinner while loading conversations', () => {
    vi.mocked(conversationsAPI.listConversations).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { container } = render(<App />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).not.toBeNull();
    if (spinner) {
      expect(spinner).toBeInTheDocument();
    }
  });

  it('displays error message when loading conversations fails', async () => {
    const errorMessage = 'Failed to fetch conversations';
    vi.mocked(conversationsAPI.listConversations).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays "No note sessions found" when list is empty', async () => {
    vi.mocked(conversationsAPI.listConversations).mockResolvedValueOnce([]);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No note sessions found/i)).toBeInTheDocument();
    });
  });

  it('loads conversation details when a conversation is selected', async () => {
    const user = userEvent.setup();
    const selectedConversation: Conversation = {
      conversationId: 'conv-1',
      messages: [
        {
          role: 'user',
          content: 'Hello',
          timestamp: '2025-01-01T00:00:00Z',
        },
      ],
      createdAt: '2025-01-01T00:00:00Z',
      lastAccessedAt: '2025-01-01T00:00:00Z',
    };

    vi.mocked(conversationsAPI.listConversations).mockResolvedValueOnce(
      mockConversations
    );
    vi.mocked(conversationsAPI.getConversationById).mockResolvedValueOnce(
      selectedConversation
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    });

    // Find the link for conv-1 and click it
    const conv1Link = screen.getByText(/conv-1/i).closest('a');
    if (conv1Link) {
      await user.click(conv1Link);

      await waitFor(() => {
        expect(conversationsAPI.getConversationById).toHaveBeenCalledWith(
          'conv-1'
        );
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
    }
  });

  it('displays error when loading conversation details fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to load conversation';

    vi.mocked(conversationsAPI.listConversations).mockResolvedValueOnce(
      mockConversations
    );
    vi.mocked(conversationsAPI.getConversationById).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    });

    // Find the link for conv-1 and click it
    const conv1Link = screen.getByText(/conv-1/i).closest('a');
    if (conv1Link) {
      await user.click(conv1Link);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    }
  });
});
