import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
          <li key={conv.conversationId} className={isActive ? 'active' : ''}>
            <Link
              to={`/conversations/${conv.conversationId}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              }}
              onClick={() => {
                onSelectConversation(conv.conversationId);
              }}
            >
              <div className="conversation-meta">
                <span className="conversation-id">
                  ID: {conv.conversationId}
                </span>
                <span className="conversation-date">
                  Last accessed:{' '}
                  {new Date(conv.lastAccessedAt).toLocaleString()}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};
