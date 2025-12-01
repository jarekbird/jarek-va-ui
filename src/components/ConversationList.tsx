import React from 'react';
import { useLocation } from 'react-router-dom';
import type { Conversation } from '../types';
import { ConversationListItem } from './ConversationListItem';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

/**
 * Presentational component that renders a list of conversation items.
 * Handles sorting and active state determination.
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
}) => {
  const location = useLocation();
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Determine active conversation from URL if not provided
  const currentConversationId =
    activeConversationId ||
    (location.pathname.startsWith('/conversations/')
      ? location.pathname.split('/conversations/')[1]
      : null);

  return (
    <ul className="conversation-list">
      {sortedConversations.map((conv) => {
        const isActive = currentConversationId === conv.conversationId;
        return (
          <ConversationListItem
            key={conv.conversationId}
            conversation={conv}
            isActive={isActive}
            onSelectConversation={onSelectConversation}
          />
        );
      })}
    </ul>
  );
};
