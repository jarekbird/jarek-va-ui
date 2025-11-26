import React from 'react';
import type { Conversation } from '../types';
import { sendMessage, getConversationById } from '../api/conversations';

interface ConversationDetailsProps {
  conversation: Conversation | null;
  onConversationUpdate?: (conversation: Conversation) => void;
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  onConversationUpdate,
}) => {
  const [message, setMessage] = React.useState<string>('');
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState<boolean>(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const pollingIntervalRef = React.useRef<number | null>(null);
  const lastMessageCountRef = React.useRef<number>(0);

  // Update last message count when conversation changes
  React.useEffect(() => {
    if (conversation) {
      lastMessageCountRef.current = conversation.messages.length;
    }
  }, [conversation]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (conversation && messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Start polling when sending a message
  React.useEffect(() => {
    if (!conversation) {
      return;
    }

    if (isPolling && conversation.conversationId) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          // Fetch updated conversation
          const updatedConversation = await getConversationById(
            conversation.conversationId
          );
          const currentMessageCount = updatedConversation.messages.length;

          // Update if there are new messages
          if (currentMessageCount > lastMessageCountRef.current) {
            lastMessageCountRef.current = currentMessageCount;
            if (onConversationUpdate) {
              onConversationUpdate(updatedConversation);
            }

            // Stop polling if we have an assistant response (last message is from assistant)
            if (
              updatedConversation.messages.length > 0 &&
              updatedConversation.messages[
                updatedConversation.messages.length - 1
              ].role === 'assistant'
            ) {
              setIsPolling(false);
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }
            }
          }
        } catch (err) {
          console.error('Error polling conversation:', err);
          // Continue polling on error
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPolling, conversation, onConversationUpdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!conversation || !message.trim() || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);
    const messageToSend = message.trim();
    setMessage('');

    // Immediately add user message to UI
    const userMessage = {
      role: 'user' as const,
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };
    const updatedConversation: Conversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage],
      lastAccessedAt: new Date().toISOString(),
    };
    if (onConversationUpdate) {
      onConversationUpdate(updatedConversation);
    }
    lastMessageCountRef.current = updatedConversation.messages.length;

    try {
      await sendMessage(conversation.conversationId, {
        message: messageToSend,
      });

      // Start polling for assistant response
      setIsPolling(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while sending the message'
      );
      setMessage(messageToSend); // Restore message on error
      // Remove the user message from UI on error
      if (onConversationUpdate && conversation) {
        onConversationUpdate(conversation);
      }
      if (conversation) {
        lastMessageCountRef.current = conversation.messages.length;
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!conversation) {
    return null;
  }

  return (
    <div className="conversation-details">
      <h2>Note Session ID: {conversation.conversationId}</h2>
      <div className="messages-container">
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
        {isPolling && (
          <div className="message assistant">
            <div className="message-role">assistant</div>
            <div className="message-content">
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
      <form onSubmit={handleSubmit} className="message-form">
        {error && <div className="error-message">{error}</div>}
        <div className="message-input-container">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            rows={3}
            disabled={isSending || isPolling}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!message.trim() || isSending || isPolling}
            className="send-button"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};
