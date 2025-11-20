import React from 'react';
import type { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
}) => {
  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(b.lastAccessedAt).getTime() -
      new Date(a.lastAccessedAt).getTime()
  );

  return (
    <ul className="conversation-list">
      {sortedConversations.map((conv) => (
        <li
          key={conv.conversationId}
          className={activeConversationId === conv.conversationId ? 'active' : ''}
          onClick={() => onSelectConversation(conv.conversationId)}
        >
          <div className="conversation-meta">
            <span className="conversation-id">ID: {conv.conversationId}</span>
            <span className="conversation-date">
              Last accessed: {new Date(conv.lastAccessedAt).toLocaleString()}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};

