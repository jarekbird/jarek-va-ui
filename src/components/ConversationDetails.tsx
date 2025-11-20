import React from 'react';
import type { Conversation } from '../types';

interface ConversationDetailsProps {
  conversation: Conversation | null;
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
}) => {
  if (!conversation) {
    return null;
  }

  return (
    <div className="conversation-details">
      <h2>Conversation ID: {conversation.conversationId}</h2>
      <div>
        {conversation.messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-role">{msg.role}</div>
            <div className="message-content">
              <pre>{msg.content}</pre>
            </div>
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

