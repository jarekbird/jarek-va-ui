import React, { useState, useEffect } from 'react';
import { ConversationList } from './components/ConversationList';
import { ConversationDetails } from './components/ConversationDetails';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { listConversations, getConversationById } from './api/conversations';
import type { Conversation } from './types';
import './styles/App.css';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  const handleSelectConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      setActiveConversationId(conversationId);
      const conversation = await getConversationById(conversationId);
      setSelectedConversation(conversation);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while loading the conversation'
      );
      setSelectedConversation(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Conversation History</h1>
      {loading && conversations.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && conversations.length > 0 && (
        <>
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
          />
          {selectedConversation && (
            <ConversationDetails conversation={selectedConversation} />
          )}
        </>
      )}
      {!loading && !error && conversations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          No conversations found.
        </p>
      )}
    </div>
  );
};

export default App;

