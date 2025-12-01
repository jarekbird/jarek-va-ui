import React from 'react';
import { Link } from 'react-router-dom';
import type { Conversation } from '../types';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelectConversation: (conversationId: string) => void;
}

/**
 * Presentational component that renders a single conversation summary item.
 * Displays conversation ID and last accessed date.
 */
export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  isActive,
  onSelectConversation,
}) => {
  return (
    <li className={isActive ? 'active' : ''}>
      <Link
        to={`/conversations/${conversation.conversationId}`}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'block',
        }}
        onClick={() => {
          onSelectConversation(conversation.conversationId);
        }}
      >
        <div className="conversation-meta">
          <span className="conversation-id">
            ID: {conversation.conversationId}
          </span>
          <span className="conversation-date">
            Last accessed:{' '}
            {new Date(conversation.lastAccessedAt).toLocaleString()}
          </span>
        </div>
      </Link>
    </li>
  );
};
