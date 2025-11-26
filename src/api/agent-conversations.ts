/**
 * API client for agent conversations.
 * Agent conversations are separate from note-taking conversations and are used
 * for voice-based interactions with the ElevenLabs agent.
 */
import type { AgentConversation } from '../types/agent-conversation';

/**
 * Base URL for agent conversation API endpoints.
 * Defaults to '/agent-conversations/api' if VITE_ELEVENLABS_AGENT_URL is not set.
 */
const getAgentApiBaseUrl = (): string => {
  const agentUrl = import.meta.env.VITE_ELEVENLABS_AGENT_URL;
  if (agentUrl) {
    // Remove trailing slash if present
    const baseUrl = agentUrl.replace(/\/$/, '');
    return `${baseUrl}/agent-conversations/api`;
  }
  return '/agent-conversations/api';
};

/**
 * Pagination options for listing agent conversations.
 */
export interface ListAgentConversationsOptions {
  /**
   * Maximum number of conversations to return
   */
  limit?: number;
  /**
   * Number of conversations to skip
   */
  offset?: number;
  /**
   * Field to sort by
   */
  sortBy?: 'createdAt' | 'lastAccessedAt' | 'messageCount';
  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response from listing agent conversations with pagination.
 */
export interface ListAgentConversationsResponse {
  conversations: AgentConversation[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * List all agent conversations with optional pagination.
 * @param options - Optional pagination parameters
 * @returns Promise resolving to conversations and pagination info
 * @throws Error if the API request fails
 */
export async function listAgentConversations(
  options?: ListAgentConversationsOptions
): Promise<ListAgentConversationsResponse> {
  const baseUrl = getAgentApiBaseUrl();
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.append('limit', options.limit.toString());
  }
  if (options?.offset !== undefined) {
    params.append('offset', options.offset.toString());
  }
  if (options?.sortBy !== undefined) {
    params.append('sortBy', options.sortBy);
  }
  if (options?.sortOrder !== undefined) {
    params.append('sortOrder', options.sortOrder);
  }
  const queryString = params.toString();
  const url = `${baseUrl}/list${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);

  // Check if response is actually JSON before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`
    );
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to fetch agent conversations: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Get a specific agent conversation by ID.
 * @param conversationId - The ID of the conversation to fetch
 * @returns Promise resolving to the agent conversation
 * @throws Error if the conversation is not found or the API request fails
 */
export async function getAgentConversation(
  id: string
): Promise<AgentConversation> {
  const baseUrl = getAgentApiBaseUrl();
  const response = await fetch(`${baseUrl}/${id}`);

  // Check if response is actually JSON before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Agent conversation not found');
    }
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to fetch agent conversation: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Request body for creating a new agent conversation.
 */
export interface CreateAgentConversationRequest {
  /**
   * Optional agent ID to associate with this conversation
   */
  agentId?: string;
  
  /**
   * Optional metadata to attach to the conversation
   */
  metadata?: Record<string, unknown>;
}

/**
 * Response from creating a new agent conversation.
 */
export interface CreateAgentConversationResponse {
  success: boolean;
  conversationId?: string;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Create a new agent conversation.
 * @param request - Optional request body with agentId and metadata
 * @returns Promise resolving to the creation response
 * @throws Error if the API request fails
 */
export async function createAgentConversation(
  request?: CreateAgentConversationRequest
): Promise<CreateAgentConversationResponse> {
  const baseUrl = getAgentApiBaseUrl();
  const response = await fetch(`${baseUrl}/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request || {}),
  });

  // Check if response is actually JSON before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`
    );
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to create agent conversation: ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Request body for sending a message to an agent conversation.
 */
export interface SendAgentMessageRequest {
  /**
   * Role of the message sender (user or assistant)
   */
  role: 'user' | 'assistant';
  
  /**
   * Content of the message
   */
  content: string;
  
  /**
   * Optional source of the message (voice or text)
   */
  source?: 'voice' | 'text';
}

/**
 * Response from sending a message to an agent conversation.
 */
export interface SendAgentMessageResponse {
  success: boolean;
  conversationId?: string;
  message?: string;
  error?: string;
}

/**
 * Send a message to an agent conversation.
 * @param conversationId - The ID of the conversation to send the message to
 * @param request - The message request with role, content, and optional source
 * @returns Promise resolving to the send response
 * @throws Error if the API request fails
 */
export async function sendAgentMessage(
  conversationId: string,
  request: SendAgentMessageRequest
): Promise<SendAgentMessageResponse> {
  const baseUrl = getAgentApiBaseUrl();
  const response = await fetch(`${baseUrl}/${conversationId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  // Check if response is actually JSON before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`
    );
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to send message: ${response.statusText}`
    );
  }

  return response.json();
}
