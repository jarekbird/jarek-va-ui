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
  onConversationUpdate?: (conversation: Conversation) => void;
}

/**
 * NoteTakingPanel - Container for note-taking conversation views
 * Shows list view by default, detail view when conversation is selected
 */
export const NoteTakingPanel: React.FC<NoteTakingPanelProps> = ({
  conversationId,
  onConversationSelect,
  onConversationUpdate,
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(conversationId);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetailUpdate = React.useCallback(
    (updatedConversation: Conversation) => {
      setConversation(updatedConversation);
      onConversationUpdate?.(updatedConversation);
    },
    [onConversationUpdate]
  );

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
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load conversation';
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

  const handleNewConversation = (conversationId: string) => {
    // Select the newly created conversation within the panel
    handleConversationSelect(conversationId);
  };

  return (
    <div className="note-taking-panel" data-testid="note-taking-panel">
      {selectedConversationId ? (
        <div className="note-taking-panel__detail">
          <button
            className="note-taking-panel__back-button note-taking-panel__back-button--top"
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
              onConversationUpdate={handleDetailUpdate}
              repository={
                'metadata' in conversation &&
                conversation.metadata &&
                typeof conversation.metadata === 'object' &&
                'repository' in conversation.metadata
                  ? String(conversation.metadata.repository)
                  : undefined
              }
            />
          )}
          <button
            className="note-taking-panel__back-button note-taking-panel__back-button--bottom"
            onClick={handleBackToList}
            aria-label="Back to note taking history"
          >
            ← Back to Note Taking History
          </button>
        </div>
      ) : (
        <ConversationListView
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
          showNavigation={false}
          showContainer={false}
        />
      )}
    </div>
  );
};
