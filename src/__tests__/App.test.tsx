import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { Conversation } from '../types';

// Mock fetch globally for integration tests
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the main heading', async () => {
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({ conversations: [] }),
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Conversation History')).toBeInTheDocument();
    });
  });

  it('loads and displays conversations on mount', async () => {
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({ conversations: mockConversations }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
      expect(screen.getByText(/conv-2/i)).toBeInTheDocument();
    });
  });

  it('displays loading spinner while loading conversations', () => {
    (mockFetch as ReturnType<typeof vi.fn>).mockImplementation(
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
    (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error(errorMessage)
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays "No conversations found" when list is empty', async () => {
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({ conversations: [] }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No conversations found/i)).toBeInTheDocument();
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

    // Mock fetchConversations call
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({ conversations: mockConversations }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    });

    // Mock fetchConversation call for detail page
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => selectedConversation,
    });

    // Find the link for conv-1 and click it
    const conv1Link = screen.getByText(/conv-1/i).closest('a');
    if (conv1Link) {
      await user.click(conv1Link);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
    }
  });

  it('displays error when loading conversation details fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to load conversation';

    // Mock fetchConversations call
    (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => ({ conversations: mockConversations }),
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/conv-1/i)).toBeInTheDocument();
    });

    // Mock fetchConversation call to fail
    (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error(errorMessage)
    );

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
