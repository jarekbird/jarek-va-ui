import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { MessageItem } from './MessageItem';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
  isPolling?: boolean;
}

/**
 * Scrollable list component that displays all messages in a conversation.
 * Automatically scrolls to the bottom when new messages are added.
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isPolling = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="message-list" ref={containerRef} data-testid="message-list">
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} index={index} />
      ))}
      {isPolling && (
        <div
          className="message-item message-item--assistant"
          data-testid="typing-indicator"
        >
          <div className="message-item__role">assistant</div>
          <div className="message-item__content">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
