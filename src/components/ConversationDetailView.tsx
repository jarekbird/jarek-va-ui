import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ConversationDetails } from './ConversationDetails';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Navigation } from './Navigation';
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
          : 'An error occurred while loading the note session'
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
        <Link to="/" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← Back to Note Taking History
        </Link>
      </div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && conversation && (
        <>
          <ConversationDetails
            conversation={conversation}
            onConversationUpdate={setConversation}
          />
          <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                color: '#374151',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              ← Back to Note Taking History
            </Link>
          </div>
        </>
      )}
      {!loading && !error && !conversation && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          Note session not found.
        </p>
      )}
    </div>
  );
};
