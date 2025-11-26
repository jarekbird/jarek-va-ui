import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AgentConversationList } from './AgentConversationList';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import {
  listAgentConversations,
  createAgentConversation,
} from '../api/agent-conversations';
import type { AgentConversation } from '../types/agent-conversation';

export const AgentConversationListView: React.FC = () => {
  const [conversations, setConversations] = React.useState<AgentConversation[]>(
    []
  );
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAgentConversations();
      setConversations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while loading agent conversations'
      );
    } finally {
      setLoading(false);
    }
  };

  // Extract conversation ID from URL if present (for highlighting active conversation)
  const activeConversationId = location.pathname.startsWith(
    '/agent-conversation/'
  )
    ? location.pathname.split('/agent-conversation/')[1]
    : null;

  const handleSelectConversation = (conversationId: string) => {
    // Navigation is handled by Link component in AgentConversationList
    // This handler is kept for compatibility but Link handles the actual navigation
    // The conversationId parameter is required by the AgentConversationList interface
    void conversationId; // Explicitly mark as used to satisfy linter
  };

  const handleNewConversation = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await createAgentConversation();
      if (response.success && response.conversationId) {
        // Navigate to the new conversation
        navigate(`/agent-conversation/${response.conversationId}`);
        // Reload conversations list to include the new one
        await loadConversations();
      } else {
        setError('Failed to create agent conversation');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while creating a new agent conversation'
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container">
      <div className="header-with-button">
        <h1>Agent Conversations</h1>
        <button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="new-conversation-button"
        >
          {isCreating ? 'Creating...' : '+ New Agent Conversation'}
        </button>
      </div>
      {loading && conversations.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && conversations.length > 0 && (
        <AgentConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
        />
      )}
      {!loading && !error && conversations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          No agent conversations found.
        </p>
      )}
    </div>
  );
};


