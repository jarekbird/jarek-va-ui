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
    const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const errorTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const successTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Scroll to bottom when messages change
    React.useEffect(() => {
      if (conversation && messagesEndRef.current?.scrollIntoView) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [conversation]);

    // Auto-dismiss error messages after 5 seconds
    React.useEffect(() => {
      if (error) {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
        errorTimeoutRef.current = setTimeout(() => {
          setError(null);
        }, 5000);
      }
      return () => {
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
        }
      };
    }, [error]);

    // Auto-dismiss success messages after 3 seconds
    React.useEffect(() => {
      if (successMessage) {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        successTimeoutRef.current = setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
      return () => {
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
      };
    }, [successMessage]);

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
        
        // Show success message
        setSuccessMessage('Message sent successfully');
        setError(null);
      } catch (err) {
        // Provide more specific error messages
        let errorMessage = 'Failed to send message';
        if (err instanceof Error) {
          if (err.message.includes('fetch') || err.message.includes('network')) {
            errorMessage = 'Network error: Please check your connection and try again';
          } else if (err.message.includes('404')) {
            errorMessage = 'Conversation not found. Please refresh the page.';
          } else if (err.message.includes('500')) {
            errorMessage = 'Server error: Please try again in a moment';
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
        setSuccessMessage(null);
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

    const createdAt = new Date(conversation.createdAt);
    const lastAccessedAt = new Date(conversation.lastAccessedAt);
    const messageCount = conversation.messages.length;
    const userMessageCount = conversation.messages.filter(m => m.role === 'user').length;
    const assistantMessageCount = conversation.messages.filter(m => m.role === 'assistant').length;

    return (
      <div className="conversation-details">
        <div className="conversation-header">
          <h2>Agent Conversation</h2>
          <div className="conversation-metadata">
            <div className="metadata-item">
              <strong>ID:</strong> <code>{conversation.conversationId}</code>
            </div>
            {conversation.agentId && (
              <div className="metadata-item">
                <strong>Agent ID:</strong> {conversation.agentId}
              </div>
            )}
            <div className="metadata-item">
              <strong>Created:</strong> {createdAt.toLocaleString()}
            </div>
            <div className="metadata-item">
              <strong>Last Accessed:</strong> {lastAccessedAt.toLocaleString()}
            </div>
            <div className="metadata-item">
              <strong>Messages:</strong> {messageCount} total ({userMessageCount} user, {assistantMessageCount} assistant)
            </div>
            {conversation.metadata && Object.keys(conversation.metadata).length > 0 && (
              <details className="metadata-details">
                <summary style={{ cursor: 'pointer', marginTop: '10px' }}>
                  <strong>Additional Metadata</strong>
                </summary>
                <pre style={{ marginTop: '10px', fontSize: '0.9em' }}>
                  {JSON.stringify(conversation.metadata, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
        <div className="messages-container">
          {conversation.messages.map((msg, index) => {
            const timestamp = new Date(msg.timestamp);
            const isRecent = Date.now() - timestamp.getTime() < 60000; // Less than 1 minute ago
            const timeDisplay = isRecent
              ? 'Just now'
              : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateDisplay = timestamp.toLocaleDateString();

            return (
              <div key={msg.messageId || index} className={`message ${msg.role}`}>
                <div className="message-header">
                  <div className="message-role">
                    {msg.role === 'user' ? '👤 You' : msg.role === 'assistant' ? '🤖 Assistant' : msg.role === 'tool' ? '🔧 Tool' : '⚙️ System'}
                    {msg.source && (
                      <span className="message-source">
                        {msg.source === 'voice' ? '🎤' : msg.source === 'text' ? '⌨️' : ''} {msg.source}
                      </span>
                    )}
                  </div>
                  <div className="message-timestamp">
                    {timeDisplay} {dateDisplay !== new Date().toLocaleDateString() && `• ${dateDisplay}`}
                  </div>
                </div>
                {msg.toolName && (
                  <div className="message-tool-info">
                    <strong>Tool:</strong> {msg.toolName}
                    {msg.toolArgs && Object.keys(msg.toolArgs).length > 0 && (
                      <details style={{ marginTop: '5px' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.9em' }}>Arguments</summary>
                        <pre style={{ fontSize: '0.8em', marginTop: '5px' }}>
                          {JSON.stringify(msg.toolArgs, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
                <div className="message-content">
                  {msg.content.includes('\n') || msg.content.length > 100 ? (
                    <pre>{msg.content}</pre>
                  ) : (
                    <div>{msg.content}</div>
                  )}
                </div>
                {msg.toolOutput && (
                  <div className="message-tool-output">
                    <strong>Output:</strong>
                    <pre>{msg.toolOutput}</pre>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="message-form">
          {error && (
            <div className="error-message" role="alert">
              {error}
              <button
                type="button"
                onClick={() => setError(null)}
                style={{
                  marginLeft: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          )}
          {successMessage && (
            <div className="success-message" role="status">
              {successMessage}
            </div>
          )}
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


