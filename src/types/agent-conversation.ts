/**
 * Type definitions for agent conversations.
 * Agent conversations are separate from note-taking conversations and are used
 * for voice-based interactions with the ElevenLabs agent.
 */

/**
 * Message role in an agent conversation.
 * 'user' - Message from the user
 * 'assistant' - Message from the agent/assistant
 * 'system' - System message
 * 'tool' - Tool execution message
 */
export type AgentMessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Source of the message in an agent conversation.
 * 'voice' - Message originated from voice input/output
 * 'text' - Message originated from text input/output
 * 'user_input' - User input (legacy)
 * 'agent_response' - Agent response (legacy)
 * 'tool_output' - Tool output (legacy)
 * 'system_event' - System event (legacy)
 */
export type AgentMessageSource = 'voice' | 'text' | 'user_input' | 'agent_response' | 'tool_output' | 'system_event';

/**
 * Individual message in an agent conversation.
 */
export interface AgentMessage {
  /**
   * Role of the message sender (user, assistant, system, or tool)
   */
  role: AgentMessageRole;
  
  /**
   * Content of the message
   */
  content: string;
  
  /**
   * Timestamp when the message was created (ISO 8601 format string)
   */
  timestamp: string;
  
  /**
   * Source of the message (voice, text, etc.)
   * Optional for backward compatibility
   */
  source?: AgentMessageSource;
  
  /**
   * Optional message ID for tracking individual messages
   */
  messageId?: string;
  
  /**
   * Optional tool name if this is a tool message
   */
  toolName?: string;
  
  /**
   * Optional tool arguments if this is a tool message
   */
  toolArgs?: Record<string, unknown>;
  
  /**
   * Optional tool output if this is a tool message
   */
  toolOutput?: string;
}

/**
 * Agent conversation interface.
 * Represents a conversation between a user and an agent (e.g., ElevenLabs voice agent).
 */
export interface AgentConversation {
  /**
   * Unique identifier for the conversation (UUID string)
   */
  conversationId: string;
  
  /**
   * Array of messages in the conversation
   */
  messages: AgentMessage[];
  
  /**
   * Timestamp when the conversation was created (ISO 8601 format string)
   */
  createdAt: string;
  
  /**
   * Timestamp when the conversation was last accessed (ISO 8601 format string)
   */
  lastAccessedAt: string;
  
  /**
   * Optional agent ID if this conversation is associated with a specific agent
   */
  agentId?: string;
  
  /**
   * Optional metadata for the conversation
   */
  metadata?: Record<string, unknown>;
}


