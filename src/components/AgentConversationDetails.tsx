import React from 'react';
import type { AgentConversation } from '../types/agent-conversation';
import { sendAgentMessage, getAgentConversation } from '../api/agent-conversations';

interface AgentConversationDetailsProps {
  conversation: AgentConversation | null;
  onConversationUpdate?: (conversation: AgentConversation) => void;
}

/**
 * AgentConversationDetails component.
 * Displays messages from an agent conversation.
 * Provides a basic text input to send text-only messages (stubbed for now if backend not ready).
 */
export const AgentConversationDetails: React.FC<AgentConversationDetailsProps> =
  ({ conversation, onConversationUpdate }) => {
    const [message, setMessage] = React.useState<string>('');
    const [isSending, setIsSending] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    React.useEffect(() => {
      if (conversation && messagesEndRef.current?.scrollIntoView) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [conversation]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!conversation || !message.trim() || isSending) {
        return;
      }

      setIsSending(true);
      setError(null);
      const messageToSend = message.trim();
      setMessage('');

      // Optimistically update UI
      const userMessage = {
        role: 'user' as const,
        content: messageToSend,
        timestamp: new Date().toISOString(),
        source: 'text' as const,
      };
      const optimisticConversation: AgentConversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage],
        lastAccessedAt: new Date().toISOString(),
      };
      if (onConversationUpdate) {
        onConversationUpdate(optimisticConversation);
      }

      try {
        // Send message to backend
        await sendAgentMessage(conversation.conversationId, {
          role: 'user',
          content: messageToSend,
          source: 'text',
        });

        // Fetch updated conversation to get any server-side updates
        const updatedConversation = await getAgentConversation(conversation.conversationId);
        if (onConversationUpdate) {
          onConversationUpdate(updatedConversation);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        // Revert optimistic update on error
        if (onConversationUpdate) {
          onConversationUpdate(conversation);
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
        <h2>Agent Conversation ID: {conversation.conversationId}</h2>
        {conversation.agentId && (
          <p style={{ color: '#7f8c8d', marginTop: '0.5rem' }}>
            Agent ID: {conversation.agentId}
          </p>
        )}
        <div className="messages-container">
          {conversation.messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-role">
                {msg.role}
                {msg.source && (
                  <span
                    style={{
                      fontSize: '0.8em',
                      marginLeft: '0.5rem',
                      color: '#7f8c8d',
                    }}
                  >
                    ({msg.source})
                  </span>
                )}
              </div>
              <div className="message-content">
                <pre>{msg.content}</pre>
              </div>
              <div className="message-timestamp">
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
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
              disabled={isSending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className="send-button"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    );
  };


