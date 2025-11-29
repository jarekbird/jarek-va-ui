import React from 'react';
import type { Message } from '../types';
import './MessageItem.css';

interface MessageItemProps {
  message: Message;
  index: number;
}

/**
 * Component that renders a single message with role, timestamp, and styling.
 */
export const MessageItem: React.FC<MessageItemProps> = ({ message, index }) => {
  const formattedTimestamp = new Date(message.timestamp).toLocaleString();

  return (
    <div
      className={`message-item message-item--${message.role}`}
      data-testid={`message-${index}`}
    >
      <div className="message-item__role">{message.role}</div>
      <div className="message-item__content">
        <pre>{message.content}</pre>
      </div>
      <div className="message-item__timestamp">{formattedTimestamp}</div>
    </div>
  );
};
