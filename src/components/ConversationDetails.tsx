import React from 'react';
import type { Conversation, Task } from '../types';
import { sendMessage, getConversationById } from '../api/conversations';
import { ConversationHeader } from './ConversationHeader';
import { MessageList } from './MessageList';
import { RelatedTasksPanel } from './RelatedTasksPanel';

interface ConversationDetailsProps {
  conversation: Conversation | null;
  onConversationUpdate?: (conversation: Conversation) => void;
  relatedTasks?: Task[];
  title?: string;
  user?: string;
  status?: string;
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  onConversationUpdate,
  relatedTasks = [],
  title,
  user,
  status,
}) => {
  const [message, setMessage] = React.useState<string>('');
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState<boolean>(false);
  const pollingIntervalRef = React.useRef<number | null>(null);
  const lastMessageCountRef = React.useRef<number>(0);

  // Update last message count when conversation changes
  React.useEffect(() => {
    if (conversation) {
      lastMessageCountRef.current = conversation.messages.length;
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
      <ConversationHeader
        conversation={conversation}
        title={title}
        user={user}
        status={status}
      />
      <MessageList messages={conversation.messages} isPolling={isPolling} />
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
      {conversation && (
        <RelatedTasksPanel
          tasks={relatedTasks}
          conversationId={conversation.conversationId}
        />
      )}
    </div>
  );
};
