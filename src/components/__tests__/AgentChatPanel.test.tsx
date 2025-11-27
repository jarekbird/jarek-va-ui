/**
 * Tests for AgentChatPanel component
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentChatPanel } from '../AgentChatPanel';

// Mock child components
vi.mock('../AgentConversationListView', () => ({
  AgentConversationListView: ({ onConversationSelect }: { onConversationSelect?: (id: string) => void }) => (
    <div data-testid="agent-conversation-list-view">
      <button onClick={() => onConversationSelect?.('conv-123')}>Select Conversation</button>
    </div>
  ),
}));

vi.mock('../AgentConversationDetailView', () => ({
  AgentConversationDetailView: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="agent-conversation-detail-view">
      Conversation: {conversationId}
    </div>
  ),
}));

vi.mock('../AgentConversationDetails', () => ({
  AgentConversationDetails: ({ conversation }: { conversation: any }) => (
    <div data-testid="agent-conversation-details">
      Conversation: {conversation?.conversationId}
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
vi.mock('../../api/agent-conversations', () => ({
  getAgentConversation: vi.fn(),
}));

describe('AgentChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list view by default', () => {
    render(<AgentChatPanel />);
    expect(screen.getByTestId('agent-conversation-list-view')).toBeInTheDocument();
  });

  it('renders detail view when conversationId is provided', async () => {
    const { getAgentConversation } = await import('../../api/agent-conversations');
    vi.mocked(getAgentConversation).mockResolvedValue({
      conversationId: 'conv-123',
      messages: [],
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    });

    render(<AgentChatPanel conversationId="conv-123" />);

    // Should show loading initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('calls onConversationSelect when conversation is selected', () => {
    const onSelect = vi.fn();
    render(<AgentChatPanel onConversationSelect={onSelect} />);

    const selectButton = screen.getByText('Select Conversation');
    selectButton.click();

    expect(onSelect).toHaveBeenCalledWith('conv-123');
  });

  it('shows back button in detail view', async () => {
    const { getAgentConversation } = await import('../../api/agent-conversations');
    vi.mocked(getAgentConversation).mockResolvedValue({
      conversationId: 'conv-123',
      messages: [],
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    });

    render(<AgentChatPanel conversationId="conv-123" />);

    // Wait for loading to complete
    await screen.findByText('← Back');
    expect(screen.getByText('← Back')).toBeInTheDocument();
  });
});


