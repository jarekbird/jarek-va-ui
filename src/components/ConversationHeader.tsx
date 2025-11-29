import React from 'react';
import type { Conversation } from '../types';
import './ConversationHeader.css';

interface ConversationHeaderProps {
  conversation: Conversation;
  title?: string;
  user?: string;
  status?: string;
}

/**
 * Component that displays conversation header information:
 * - Title (or conversationId if title not provided)
 * - User (if provided)
 * - Created/Updated timestamps
 * - Status (if provided)
 */
export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  title,
  user,
  status,
}) => {
  const formattedCreatedAt = new Date(conversation.createdAt).toLocaleString();
  const formattedLastAccessedAt = new Date(
    conversation.lastAccessedAt
  ).toLocaleString();

  return (
    <div className="conversation-header" data-testid="conversation-header">
      <div className="conversation-header__title-row">
        <h2 className="conversation-header__title">
          {title || `Conversation ID: ${conversation.conversationId}`}
        </h2>
        {status && (
          <span
            className="conversation-header__status"
            data-testid="conversation-status"
          >
            {status}
          </span>
        )}
      </div>
      {user && (
        <div
          className="conversation-header__user"
          data-testid="conversation-user"
        >
          User: {user}
        </div>
      )}
      <div className="conversation-header__metadata">
        <div className="conversation-header__metadata-item">
          <span className="conversation-header__metadata-label">Created:</span>
          <span className="conversation-header__metadata-value">
            {formattedCreatedAt}
          </span>
        </div>
        <div className="conversation-header__metadata-item">
          <span className="conversation-header__metadata-label">
            Last Accessed:
          </span>
          <span className="conversation-header__metadata-value">
            {formattedLastAccessedAt}
          </span>
        </div>
      </div>
    </div>
  );
};
