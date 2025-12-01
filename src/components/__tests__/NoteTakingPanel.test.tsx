/**
 * Tests for NoteTakingPanel component
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NoteTakingPanel } from '../NoteTakingPanel';
import type { Conversation } from '../../types';

// Mock child components
vi.mock('../ConversationListView', () => ({
  ConversationListView: ({
    onConversationSelect,
  }: {
    onConversationSelect?: (id: string) => void;
  }) => (
    <div data-testid="conversation-list-view">
      <button onClick={() => onConversationSelect?.('conv-123')}>
        Select Conversation
      </button>
    </div>
  ),
}));

vi.mock('../ConversationDetails', () => ({
  ConversationDetails: ({
    conversation,
    repository,
  }: {
    conversation: Conversation;
    repository?: string;
  }) => (
    <div data-testid="conversation-details">
      Conversation: {conversation?.conversationId}
      {repository && <div>Repository: {repository}</div>}
    </div>
  ),
}));

vi.mock('../LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('../ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => (
    <div data-testid="error-message">{message}</div>
  ),
}));

// Mock API
vi.mock('../../api/conversations', () => ({
  getConversationById: vi.fn(),
}));

describe('NoteTakingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list view by default', () => {
    render(<NoteTakingPanel />);
    expect(screen.getByTestId('conversation-list-view')).toBeInTheDocument();
  });

  it('renders detail view when conversationId is provided', async () => {
    const { getConversationById } = await import('../../api/conversations');
    vi.mocked(getConversationById).mockResolvedValue({
      conversationId: 'conv-123',
      messages: [],
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    });

    render(<NoteTakingPanel conversationId="conv-123" />);

    // Should show loading initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('calls onConversationSelect when conversation is selected', () => {
    const onSelect = vi.fn();
    render(<NoteTakingPanel onConversationSelect={onSelect} />);

    const selectButton = screen.getByText('Select Conversation');
    selectButton.click();

    expect(onSelect).toHaveBeenCalledWith('conv-123');
  });

  it('passes repository to ConversationDetails when available', async () => {
    const { getConversationById } = await import('../../api/conversations');
    vi.mocked(getConversationById).mockResolvedValue({
      conversationId: 'conv-123',
      messages: [],
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      metadata: { repository: 'test-repo' },
    } as Conversation & { metadata?: { repository?: string } });

    render(<NoteTakingPanel conversationId="conv-123" />);

    // Wait for loading to complete and check repository is passed
    await screen.findByTestId('conversation-details');
    expect(screen.getByText('Repository: test-repo')).toBeInTheDocument();
  });

  it('shows back button in detail view', async () => {
    const { getConversationById } = await import('../../api/conversations');
    vi.mocked(getConversationById).mockResolvedValue({
      conversationId: 'conv-123',
      messages: [],
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    });

    render(<NoteTakingPanel conversationId="conv-123" />);

    // Wait for loading to complete
    await screen.findByText('← Back');
    expect(screen.getByText('← Back')).toBeInTheDocument();
  });
});
