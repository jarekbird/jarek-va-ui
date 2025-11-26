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
 * List all agent conversations.
 * @returns Promise resolving to an array of agent conversations
 * @throws Error if the API request fails
 */
export async function listAgentConversations(): Promise<AgentConversation[]> {
  const baseUrl = getAgentApiBaseUrl();
  const response = await fetch(`${baseUrl}/list`);

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

