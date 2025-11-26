import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ConversationDetails } from './ConversationDetails';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { getConversationById } from '../api/conversations';
import type { Conversation } from '../types';

export const ConversationDetailView: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversation, setConversation] = React.useState<Conversation | null>(
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
      const data = await getConversationById(id);
      setConversation(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while loading the conversation'
      );
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← Back to Note Taking History
        </Link>
      </div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && conversation && (
        <ConversationDetails
          conversation={conversation}
          onConversationUpdate={setConversation}
        />
      )}
      {!loading && !error && !conversation && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          Note session not found.
        </p>
      )}
    </div>
  );
};
