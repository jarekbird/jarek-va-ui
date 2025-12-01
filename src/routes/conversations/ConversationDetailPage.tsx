import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ConversationDetails } from '../../components/ConversationDetails';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useConversationQuery } from '../../hooks/useConversationQuery';

/**
 * Route component for displaying a single conversation detail view.
 * Reads conversationId from route params and uses useConversationQuery to fetch data.
 */
export const ConversationDetailPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();

  // Use the query hook to fetch conversation
  const {
    data: conversation,
    isLoading,
    isError,
    error,
    refetch,
  } = useConversationQuery(conversationId || '', {
    enabled: !!conversationId,
  });

  // Handle conversation update callback
  const handleConversationUpdate = React.useCallback(() => {
    // Refetch to ensure we have the latest data
    void refetch();
  }, [refetch]);

  // Determine error message
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? 'An error occurred while loading the conversation'
        : null;

  // Handle not found state (no conversationId or conversation not found)
  const isNotFound =
    !conversationId || (!isLoading && !isError && !conversation);

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/conversations"
          style={{ color: '#3498db', textDecoration: 'none' }}
        >
          ← Back to Conversations
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && <LoadingSpinner />}

      {/* Error state */}
      {errorMessage && <ErrorMessage message={errorMessage} />}

      {/* Not found state */}
      {isNotFound && !isLoading && !errorMessage && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          Conversation not found.
        </p>
      )}

      {/* Success state with conversation */}
      {!isLoading && !errorMessage && conversation && (
        <ConversationDetails
          conversation={conversation}
          onConversationUpdate={handleConversationUpdate}
        />
      )}
    </div>
  );
};
