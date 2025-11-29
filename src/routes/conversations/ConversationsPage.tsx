import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConversationList } from '../../components/ConversationList';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useConversationsQuery } from '../../hooks/useConversationsQuery';
import { createConversation } from '../../api/conversations';

export const ConversationsPage: React.FC = () => {
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Use the query hook to fetch conversations
  const { data, isLoading, isError, error, refetch } = useConversationsQuery();

  const conversations = data?.conversations ?? [];

  // Extract conversation ID from URL if present (for highlighting active conversation)
  const activeConversationId = location.pathname.startsWith('/conversations/')
    ? location.pathname.split('/conversations/')[1]
    : null;

  const handleSelectConversation = (conversationId: string) => {
    // Navigation is handled by Link component in ConversationList
    // This handler is kept for compatibility but Link handles the actual navigation
    // The conversationId parameter is required by the ConversationList interface
    void conversationId; // Explicitly mark as used to satisfy linter
  };

  const handleNewConversation = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createConversation({ queueType: 'api' });
      if (response.success && response.conversationId) {
        // Navigate to the new conversation
        navigate(`/conversations/${response.conversationId}`);
        // Refetch conversations list to include the new one
        await refetch();
      } else {
        setCreateError('Failed to create conversation');
      }
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : 'An error occurred while creating a new conversation'
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Determine error message
  const errorMessage =
    createError ||
    (isError && error instanceof Error
      ? error.message
      : isError
        ? 'An error occurred while loading conversations'
        : null);

  return (
    <div className="container">
      <div className="header-with-button">
        <h1>Conversation History</h1>
        <button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="new-conversation-button"
        >
          {isCreating ? 'Creating...' : '+ New Conversation'}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && conversations.length === 0 && <LoadingSpinner />}

      {/* Error state */}
      {errorMessage && <ErrorMessage message={errorMessage} />}

      {/* Success state with conversations */}
      {!isLoading && conversations.length > 0 && (
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
        />
      )}

      {/* Empty state */}
      {!isLoading && !errorMessage && conversations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          No conversations found.
        </p>
      )}
    </div>
  );
};
