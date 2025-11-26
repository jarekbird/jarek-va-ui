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
  const [conversation, setConversation] = React.useState<AgentConversation | null>(
    null
  );
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

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
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/agent-conversations"
          style={{ color: '#3498db', textDecoration: 'none' }}
        >
          ← Back to Agent Conversations
        </Link>
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


