/**
 * NoteTakingPanel Component
 * Wraps note-taking conversation views for the Dashboard
 * Can display list or detail view of note-taking conversations
 */

import React, { useState } from 'react';
import { ConversationListView } from './ConversationListView';
import { ConversationDetails } from './ConversationDetails';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { getConversationById } from '../api/conversations';
import type { Conversation } from '../types';
import './NoteTakingPanel.css';

export interface NoteTakingPanelProps {
  conversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
}

/**
 * NoteTakingPanel - Container for note-taking conversation views
 * Shows list view by default, detail view when conversation is selected
 */
export const NoteTakingPanel: React.FC<NoteTakingPanelProps> = ({
  conversationId,
  onConversationSelect,
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    conversationId
  );
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedConversationId) {
      loadConversation(selectedConversationId);
    } else {
      setConversation(null);
    }
  }, [selectedConversationId]);

  const loadConversation = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversationById(id);
      setConversation(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (id: string) => {
    setSelectedConversationId(id);
    if (onConversationSelect) {
      onConversationSelect(id);
    }
  };

  const handleBackToList = () => {
    setSelectedConversationId(undefined);
    setConversation(null);
  };

  return (
    <div className="note-taking-panel" data-testid="note-taking-panel">
      {selectedConversationId ? (
        <div className="note-taking-panel__detail">
          <button
            className="note-taking-panel__back-button"
            onClick={handleBackToList}
            aria-label="Back to list"
          >
            ← Back
          </button>
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {conversation && !loading && !error && (
            <ConversationDetails
              conversation={conversation}
              onConversationUpdate={setConversation}
              repository={(conversation as any).metadata?.repository as string | undefined}
            />
          )}
        </div>
      ) : (
        <ConversationListView onConversationSelect={handleConversationSelect} />
      )}
    </div>
  );
};

