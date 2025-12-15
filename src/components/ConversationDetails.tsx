import React from 'react';
import type { Conversation } from '../types';
import { sendMessage, getConversationById } from '../api/conversations';
import { RepositoryFileBrowser } from './RepositoryFileBrowser';
import { getRepositoryFiles } from '../api/repositories';
import type { FileNode } from '../types/file-tree';

interface ConversationDetailsProps {
  conversation: Conversation | null;
  onConversationUpdate?: (conversation: Conversation) => void;
  /**
   * Optional repository identifier for the file browser.
   * If not provided, the file browser will not be displayed.
   */
  repository?: string;
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({
  conversation,
  onConversationUpdate,
  repository,
}) => {
  // Local copy of the conversation to ensure UI updates immediately,
  // even if parent components don't re-render in sync.
  const [localConversation, setLocalConversation] =
    React.useState<Conversation | null>(conversation);

  const [message, setMessage] = React.useState<string>('');
  const [isSending, setIsSending] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isPolling, setIsPolling] = React.useState<boolean>(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const pollingIntervalRef = React.useRef<number | null>(null);
  const lastMessageCountRef = React.useRef<number>(0);
  const lastMessageContentRef = React.useRef<string>(''); // Track last message content for streaming detection
  const conversationIdRef = React.useRef<string | null>(null);
  const currentConversationRef = React.useRef<Conversation | null>(null);

  // File browser state
  const [fileTree, setFileTree] = React.useState<FileNode[]>([]);
  const [fileTreeLoading, setFileTreeLoading] = React.useState<boolean>(false);
  const [fileTreeError, setFileTreeError] = React.useState<string | null>(null);

  // Keep local conversation in sync when parent prop changes
  React.useEffect(() => {
    setLocalConversation(conversation);
  }, [conversation]);

  // Update refs when local conversation changes
  React.useEffect(() => {
    if (localConversation) {
      lastMessageCountRef.current = localConversation.messages.length;
      conversationIdRef.current = localConversation.conversationId;
      currentConversationRef.current = localConversation;
      // Update last message content ref for streaming detection
      if (localConversation.messages.length > 0) {
        const lastMsg =
          localConversation.messages[localConversation.messages.length - 1];
        lastMessageContentRef.current = lastMsg.content;
      }
    }
  }, [localConversation]);

  // Load file tree when repository is provided
  React.useEffect(() => {
    if (repository) {
      loadFileTree(repository);
    } else {
      setFileTree([]);
      setFileTreeError(null);
    }
  }, [repository]);

  const loadFileTree = async (repo: string) => {
    try {
      setFileTreeLoading(true);
      setFileTreeError(null);
      const files = await getRepositoryFiles(repo);
      setFileTree(files);
    } catch (err) {
      setFileTreeError(
        err instanceof Error
          ? err.message
          : 'Failed to load repository file structure'
      );
      setFileTree([]);
    } finally {
      setFileTreeLoading(false);
    }
  };

  // Scroll to bottom when messages change
  React.useEffect(() => {
    if (localConversation && messagesEndRef.current?.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localConversation]);

  // Start polling when sending a message
  React.useEffect(() => {
    if (!isPolling || !conversationIdRef.current) {
      return;
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        // Use ref to get current conversation ID (doesn't depend on prop changes)
        const conversationId = conversationIdRef.current;
        if (!conversationId) {
          return;
        }

        // Fetch updated conversation from server
        const serverConversation = await getConversationById(conversationId);
        const serverMessageCount = serverConversation.messages.length;
        const currentLocalCount = lastMessageCountRef.current;

        // Get the current local conversation to preserve any optimistic updates
        const localConversation = currentConversationRef.current;
        const localMessages = localConversation?.messages || [];
        const serverMessages = serverConversation.messages;

        // Check if there are changes:
        // 1. New messages added (count increased)
        // 2. Existing messages updated (content changed, e.g., streaming appends)
        const hasNewMessages = serverMessageCount > currentLocalCount;

        // For streaming: check if last message content changed (even if count is same)
        // This detects when the backend appends to the last message in real-time
        const lastServerMessage =
          serverMessages.length > 0
            ? serverMessages[serverMessages.length - 1]
            : null;
        const lastServerContent = lastServerMessage?.content || '';
        const previousLastContent = lastMessageContentRef.current;
        const hasUpdatedMessages =
          lastServerContent !== previousLastContent &&
          lastServerContent.length > 0;

        // Update if there are new messages OR if existing messages were updated (streaming)
        if (hasNewMessages || hasUpdatedMessages) {
          // Merge strategy: Use server messages as source of truth
          // Match messages by role+content (not timestamp) to identify duplicates
          const serverMessageKeys = new Set(
            serverMessages.map((m) => `${m.role}:${m.content}`)
          );

          // Start with server messages (they have authoritative timestamps and content)
          const mergedMessages = [...serverMessages];

          // Add any local messages that aren't in server yet (optimistic updates not yet saved)
          localMessages.forEach((localMsg) => {
            const localKey = `${localMsg.role}:${localMsg.content}`;
            if (!serverMessageKeys.has(localKey)) {
              mergedMessages.push(localMsg);
            }
          });

          // Sort by timestamp to maintain chronological order
          mergedMessages.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          const mergedConversation: Conversation = {
            ...serverConversation,
            messages: mergedMessages,
          };

          lastMessageCountRef.current = mergedMessages.length;
          // Update last message content ref for next comparison
          if (mergedMessages.length > 0) {
            const lastMsg = mergedMessages[mergedMessages.length - 1];
            lastMessageContentRef.current = lastMsg.content;
          }

          if (onConversationUpdate) {
            onConversationUpdate(mergedConversation);
          }
        }

        // Always check for completion on every poll (not just when there are updates)
        // Stop polling if we have an assistant response (last message is from assistant)
        // AND the message content hasn't changed (streaming has completed)
        // We detect completion by checking if content is stable (same as last poll)
        if (
          lastServerMessage &&
          lastServerMessage.role === 'assistant' &&
          !hasUpdatedMessages // Content hasn't changed since last poll = streaming complete
        ) {
          // Update refs before stopping to ensure they're current
          lastMessageCountRef.current = serverMessageCount;
          lastMessageContentRef.current = lastServerMessage.content;

          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Error polling conversation:', err);
        // Continue polling on error
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPolling, onConversationUpdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!localConversation || !message.trim() || isSending) {
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
      ...localConversation,
      messages: [...localConversation.messages, userMessage],
      lastAccessedAt: new Date().toISOString(),
    };

    // Update refs immediately to ensure they're current before polling starts
    lastMessageCountRef.current = updatedConversation.messages.length;
    conversationIdRef.current = updatedConversation.conversationId;
    currentConversationRef.current = updatedConversation;

    // Update local state immediately so the UI reflects the new message
    setLocalConversation(updatedConversation);

    // Update parent component state (for list views, routing, etc.)
    if (onConversationUpdate) {
      onConversationUpdate(updatedConversation);
    }

    try {
      await sendMessage(localConversation.conversationId, {
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
      if (onConversationUpdate && localConversation) {
        onConversationUpdate(localConversation);
      }
      if (localConversation) {
        // Revert local state and refs to previous conversation
        setLocalConversation(localConversation);
        lastMessageCountRef.current = localConversation.messages.length;
        conversationIdRef.current = localConversation.conversationId;
        currentConversationRef.current = localConversation;
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!localConversation) {
    return null;
  }

  return (
    <div className="conversation-details">
      <h2>Note Session ID: {localConversation.conversationId}</h2>
      {repository && (
        <div className="repository-file-browser-container">
          <RepositoryFileBrowser
            repository={repository}
            files={fileTree}
            loading={fileTreeLoading}
            error={fileTreeError}
          />
        </div>
      )}
      <div className="messages-container">
        {localConversation.messages.map((msg, index) => (
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
              // On mobile devices, Enter should always create a new line
              // Only submit on Enter+Shift or Enter on desktop (non-mobile)
              const isMobile =
                /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                  navigator.userAgent
                ) || window.innerWidth <= 768;

              if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
                e.preventDefault();
                handleSubmit(e);
              }
              // On mobile, Enter always creates a new line (default behavior)
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
// test change
// test
