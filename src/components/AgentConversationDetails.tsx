import React from 'react';
import type { AgentConversation } from '../types/agent-conversation';
import {
  sendAgentMessage,
  getAgentConversation,
} from '../api/agent-conversations';
import type {
  ElevenLabsVoiceService,
  ConnectionStatus,
  AgentMode,
} from '../services/elevenlabs-voice';
import { isElevenLabsEnabled } from '../utils/feature-flags';
import { getAgentConfig } from '../api/elevenlabs';

interface AgentConversationDetailsProps {
  conversation: AgentConversation | null;
  onConversationUpdate?: (conversation: AgentConversation) => void;
  voiceService?: ElevenLabsVoiceService | null;
  voiceStatus?: ConnectionStatus;
  voiceMode?: AgentMode;
}

/**
 * AgentConversationDetails component.
 * Displays messages from an agent conversation.
 * Provides a basic text input to send text-only messages (stubbed for now if backend not ready).
 */
export const AgentConversationDetails: React.FC<
  AgentConversationDetailsProps
> = ({
  conversation,
  onConversationUpdate,
  voiceService,
  voiceStatus,
  voiceMode,
}) => {
  const [message, setMessage] = React.useState<string>('');
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );
  const [isStartingVoice, setIsStartingVoice] = React.useState<boolean>(false);
  const [agentId, setAgentId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const errorTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const successTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Load agent ID from config on mount
  React.useEffect(() => {
    if (isElevenLabsEnabled()) {
      getAgentConfig()
        .then((config) => {
          if (config.agentId) {
            setAgentId(config.agentId);
          }
        })
        .catch((err) => {
          console.warn('Failed to load agent config:', err);
        });
    }
  }, []);

  // Wire voice service message handler
  React.useEffect(() => {
    if (!voiceService || !conversation || !onConversationUpdate) {
      return;
    }

    const handleVoiceMessage = async (messageContent: string) => {
      try {
        // Send voice message to backend
        await sendAgentMessage(conversation.conversationId, {
          role: 'user',
          content: messageContent,
          source: 'voice',
        });

        // Refresh conversation to get updated messages
        const updatedConversation = await getAgentConversation(
          conversation.conversationId
        );
        onConversationUpdate(updatedConversation);
      } catch (err) {
        console.error('Failed to save voice message:', err);
      }
    };

    const handleAgentVoiceMessage = async (messageContent: string) => {
      try {
        // Persist agent (assistant) text from ElevenLabs into agent conversation history
        await sendAgentMessage(conversation.conversationId, {
          role: 'assistant',
          content: messageContent,
          source: 'voice',
        });

        // Refresh conversation to get updated messages
        const updatedConversation = await getAgentConversation(
          conversation.conversationId
        );
        onConversationUpdate(updatedConversation);
      } catch (err) {
        console.error('Failed to save agent voice message:', err);
      }
    };

    // Configure voice service to handle messages
    voiceService.configure({
      onMessage: handleVoiceMessage,
      onAgentMessage: handleAgentVoiceMessage,
      conversationId: conversation.conversationId,
    });

    return () => {
      // Cleanup: remove message handler
      voiceService.configure({
        onMessage: undefined,
        onAgentMessage: undefined,
      });
    };
  }, [voiceService, conversation, onConversationUpdate]);

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (conversation && messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to get accurate scrollHeight
      textarea.style.height = 'auto';
      // Set height based on content, respecting min/max constraints
      const scrollHeight = textarea.scrollHeight;
      const minHeight = 150; // min-height from CSS
      const maxHeight = 300; // max-height from CSS
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Adjust textarea height when message changes
  React.useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  // Set initial height on mount
  React.useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

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
    // Reset textarea height after clearing message
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
      const updatedConversation = await getAgentConversation(
        conversation.conversationId
      );
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
          errorMessage =
            'Network error: Please check your connection and try again';
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
  const userMessageCount = conversation.messages.filter(
    (m) => m.role === 'user'
  ).length;
  const assistantMessageCount = conversation.messages.filter(
    (m) => m.role === 'assistant'
  ).length;

  const handleExport = () => {
    const exportData = {
      conversationId: conversation.conversationId,
      agentId: conversation.agentId,
      createdAt: conversation.createdAt,
      lastAccessedAt: conversation.lastAccessedAt,
      metadata: conversation.metadata,
      messages: conversation.messages,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-conversation-${conversation.conversationId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStartVoice = async () => {
    if (!voiceService || !agentId || !conversation) {
      setError('Voice service or agent ID not available');
      return;
    }

    setIsStartingVoice(true);
    setError(null);

    try {
      await voiceService.startVoiceSession(
        agentId,
        conversation.conversationId
      );
      setSuccessMessage('Voice session started');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start voice session';
      setError(errorMessage);
    } finally {
      setIsStartingVoice(false);
    }
  };

  const handleStopVoice = () => {
    if (voiceService) {
      voiceService.endVoiceSession();
      setSuccessMessage('Voice session ended');
    }
  };

  return (
    <div className="conversation-details">
      <div className="conversation-header">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2>Agent Conversation</h2>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9em',
            }}
          >
            📥 Export
          </button>
        </div>
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
            <strong>Messages:</strong> {messageCount} total ({userMessageCount}{' '}
            user, {assistantMessageCount} assistant)
          </div>
          {conversation.metadata &&
            Object.keys(conversation.metadata).length > 0 && (
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
            : timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
          const dateDisplay = timestamp.toLocaleDateString();

          return (
            <div key={msg.messageId || index} className={`message ${msg.role}`}>
              <div className="message-header">
                <div className="message-role">
                  {msg.role === 'user'
                    ? '👤 You'
                    : msg.role === 'assistant'
                      ? '🤖 Assistant'
                      : msg.role === 'tool'
                        ? '🔧 Tool'
                        : '⚙️ System'}
                  {msg.source && (
                    <span className="message-source">
                      {msg.source === 'voice'
                        ? '🎤'
                        : msg.source === 'text'
                          ? '⌨️'
                          : ''}{' '}
                      {msg.source}
                    </span>
                  )}
                  {msg.role === 'user' && (
                    <span className="message-status" title="Message sent">
                      ✓
                    </span>
                  )}
                  {msg.role === 'assistant' && msg.toolName && (
                    <span
                      className="message-status tool-status"
                      title="Tool execution"
                    >
                      🔧
                    </span>
                  )}
                </div>
                <div className="message-timestamp">
                  {timeDisplay}{' '}
                  {dateDisplay !== new Date().toLocaleDateString() &&
                    `• ${dateDisplay}`}
                </div>
              </div>
              {msg.toolName && (
                <div className="message-tool-info">
                  <strong>Tool:</strong> {msg.toolName}
                  {msg.toolArgs && Object.keys(msg.toolArgs).length > 0 && (
                    <details style={{ marginTop: '5px' }}>
                      <summary style={{ cursor: 'pointer', fontSize: '0.9em' }}>
                        Arguments
                      </summary>
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
      {isElevenLabsEnabled() && voiceService && (
        <div
          className="voice-controls"
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem',
            }}
          >
            <strong>Voice Session:</strong>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                backgroundColor:
                  voiceStatus === 'connected'
                    ? '#10b981'
                    : voiceStatus === 'connecting' ||
                        voiceStatus === 'reconnecting'
                      ? '#3b82f6'
                      : voiceStatus === 'error'
                        ? '#ef4444'
                        : '#9ca3af',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              {voiceStatus === 'connected'
                ? 'Connected'
                : voiceStatus === 'connecting'
                  ? 'Connecting...'
                  : voiceStatus === 'reconnecting'
                    ? 'Reconnecting...'
                    : voiceStatus === 'error'
                      ? 'Error'
                      : 'Disconnected'}
            </span>
            {voiceStatus === 'connected' && voiceMode && (
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Mode: {voiceMode}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {voiceStatus === 'disconnected' || voiceStatus === 'error' ? (
              <button
                type="button"
                onClick={handleStartVoice}
                disabled={isStartingVoice || !agentId}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor:
                    isStartingVoice || !agentId ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: isStartingVoice || !agentId ? 0.6 : 1,
                }}
                aria-label="Start voice session"
              >
                {isStartingVoice ? 'Starting...' : '🎤 Start Voice'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopVoice}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}
                aria-label="Stop voice session"
              >
                🛑 Stop Voice
              </button>
            )}
          </div>
        </div>
      )}
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
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            placeholder="Type your message..."
            className="message-input"
            rows={1}
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
