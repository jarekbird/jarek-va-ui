/**
 * AgentChatPanel Component
 * Wraps agent conversation views for the Dashboard
 * Can display list or detail view of agent conversations
 */

import React, { useState } from 'react';
import { AgentConversationListView } from './AgentConversationListView';
import { AgentConversationDetails } from './AgentConversationDetails';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { getAgentConversation } from '../api/agent-conversations';
import type { AgentConversation } from '../types/agent-conversation';
import type {
  ElevenLabsVoiceService,
  ConnectionStatus,
  AgentMode,
} from '../services/elevenlabs-voice';
import './AgentChatPanel.css';

export interface AgentChatPanelProps {
  conversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
  voiceService?: ElevenLabsVoiceService | null;
  voiceStatus?: ConnectionStatus;
  voiceMode?: AgentMode;
}

/**
 * AgentChatPanel - Container for agent conversation views
 * Shows list view by default, detail view when conversation is selected
 */
export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
  conversationId,
  onConversationSelect,
  voiceService,
  voiceStatus,
  voiceMode,
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >(conversationId);
  const [conversation, setConversation] = useState<AgentConversation | null>(
    null
  );
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
      const data = await getAgentConversation(id);
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

  return (
    <div className="agent-chat-panel" data-testid="agent-chat-panel">
      {selectedConversationId ? (
        <div className="agent-chat-panel__detail">
          <button
            className="agent-chat-panel__back-button"
            onClick={handleBackToList}
            aria-label="Back to list"
          >
            ← Back
          </button>
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {conversation && !loading && !error && (
            <AgentConversationDetails
              conversation={conversation}
              voiceService={voiceService}
              voiceStatus={voiceStatus}
              voiceMode={voiceMode}
              onConversationUpdate={(updated) => {
                setConversation(updated);
              }}
            />
          )}
        </div>
      ) : (
        <AgentConversationListView
          onConversationSelect={handleConversationSelect}
          showNavigation={false}
          showContainer={false}
        />
      )}
    </div>
  );
};
