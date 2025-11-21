import React from 'react';
import { useLocation } from 'react-router-dom';
import { ConversationList } from './ConversationList';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { listConversations } from '../api/conversations';
import type { Conversation } from '../types';

export const ConversationListView: React.FC = () => {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const location = useLocation();

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
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while loading conversations'
      );
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

  return (
    <div className="container">
      <h1>Conversation History</h1>
      {loading && conversations.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && conversations.length > 0 && (
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
        />
      )}
      {!loading && !error && conversations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          No conversations found.
        </p>
      )}
    </div>
  );
};
