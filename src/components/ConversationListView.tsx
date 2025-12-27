import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConversationList } from './ConversationList';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Navigation } from './Navigation';
import { listConversations, createConversation } from '../api/conversations';
import type { Conversation } from '../types';

export interface ConversationListViewProps {
  onConversationSelect?: (conversationId: string) => void;
  onNewConversation?: (conversationId: string) => void;
  showNavigation?: boolean;
  showContainer?: boolean;
}

export const ConversationListView: React.FC<ConversationListViewProps> = ({
  onConversationSelect,
  onNewConversation,
  showNavigation = true,
  showContainer = true,
}) => {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  // Synchronous guard to prevent double-submit races before React state updates apply
  const isCreatingRef = React.useRef<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listConversations();
      setConversations(data);
    } catch (err) {
      let errorMessage = 'An error occurred while loading note sessions';
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage =
            'Network error: Please check your connection and try again';
        } else if (err.message.includes('404')) {
          errorMessage =
            'Service not found. Please check if the backend is running.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error: Please try again in a moment';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Extract conversation ID from URL if present (for highlighting active conversation)
  const activeConversationId = location.pathname.startsWith('/conversation/')
    ? location.pathname.split('/conversation/')[1]
    : null;

  const handleSelectConversation = (conversationId: string) => {
    // Navigation is handled by Link component in ConversationList
    // This handler is kept for compatibility but Link handles the actual navigation
    // The conversationId parameter is required by the ConversationList interface
    void conversationId; // Explicitly mark as used to satisfy linter
  };

  const handleNewConversation = async () => {
    // Use ref (not state) to prevent rapid double clicks from dispatching multiple requests
    if (isCreatingRef.current || isCreating) {
      return;
    }

    isCreatingRef.current = true;
    setIsCreating(true);
    setError(null);

    try {
      const response = await createConversation({ queueType: 'api' });
      if (response.success && response.conversationId) {
        // If onNewConversation callback is provided (Dashboard mode), use it instead of navigating
        if (onNewConversation) {
          onNewConversation(response.conversationId);
        } else {
          // Navigate to the new conversation (standalone mode)
          navigate(`/conversation/${response.conversationId}`);
        }
        // Reload conversations list to include the new one
        await loadConversations();
      } else {
        setError('Failed to create note session');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while creating a new note session'
      );
    } finally {
      setIsCreating(false);
      isCreatingRef.current = false;
    }
  };

  const content = (
    <>
      {showNavigation && <Navigation />}
      <div className="header-with-button">
        {showContainer && <h1>Note Taking History</h1>}
        {!showContainer && (
          <h2 style={{ margin: 0, marginBottom: '10px' }}>
            Note Taking History
          </h2>
        )}
        <button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="new-conversation-button"
        >
          {isCreating ? 'Creating...' : '+ New Note'}
        </button>
      </div>
      {loading && conversations.length === 0 && <LoadingSpinner />}
      {error && (
        <div>
          <ErrorMessage message={error} />
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              onClick={loadConversations}
              className="retry-button"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {!loading && conversations.length > 0 && (
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onConversationSelect={onConversationSelect}
        />
      )}
      {!loading && !error && conversations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          No note sessions found.
        </p>
      )}
    </>
  );

  if (showContainer) {
    return <div className="container">{content}</div>;
  }

  return <div className="conversation-list-view-panel">{content}</div>;
};
