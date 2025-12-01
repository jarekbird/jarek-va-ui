import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AgentConversationDetails } from './AgentConversationDetails';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Navigation } from './Navigation';
import { getAgentConversation } from '../api/agent-conversations';
import type { AgentConversation } from '../types/agent-conversation';

export const AgentConversationDetailView: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] =
    React.useState<AgentConversation | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  // Poll for updates when conversation is loaded
  React.useEffect(() => {
    if (!conversationId || !conversation || loading) {
      return;
    }

    setIsPolling(true);

    // Poll every 3 seconds for new messages
    const pollInterval = setInterval(async () => {
      try {
        const updatedConversation = await getAgentConversation(conversationId);
        // Only update if messages have changed (to avoid unnecessary re-renders)
        if (
          updatedConversation.messages.length !==
            conversation.messages.length ||
          JSON.stringify(updatedConversation.messages) !==
            JSON.stringify(conversation.messages)
        ) {
          setConversation(updatedConversation);
        }
      } catch (err) {
        // Silently fail polling errors to avoid disrupting user experience
        // Only log if it's not a network error (which is expected when offline)
        if (err instanceof Error && !err.message.includes('fetch')) {
          console.warn('Failed to poll for conversation updates:', err);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [conversationId, conversation, loading]);

  const handleRefresh = async () => {
    if (!conversationId || isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      const updatedConversation = await getAgentConversation(conversationId);
      setConversation(updatedConversation);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while refreshing the conversation'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAgentConversation(id);
      setConversation(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while loading the agent conversation'
      );
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Navigation />
      <div
        style={{
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          to="/agent-conversations"
          style={{ color: '#3498db', textDecoration: 'none' }}
        >
          ← Back to Agent Conversations
        </Link>
        {!loading && conversation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPolling && (
              <span
                style={{
                  fontSize: '0.85em',
                  color: '#7f8c8d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#27ae60',
                    animation: 'pulse 2s infinite',
                  }}
                />
                Live updates
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                fontSize: '0.9em',
                opacity: isRefreshing ? 0.6 : 1,
              }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        )}
      </div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && conversation && (
        <AgentConversationDetails
          conversation={conversation}
          onConversationUpdate={setConversation}
        />
      )}
      {!loading && !error && !conversation && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          Agent conversation not found.
        </p>
      )}
    </div>
  );
};
