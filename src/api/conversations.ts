/**
 * API client for note-taking conversations.
 * Note: These endpoints use the legacy "/conversations/api" path for backward compatibility.
 * The UI displays these as "Note Taking History" but the API endpoints remain unchanged.
 */
import type { Conversation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/conversations/api';

export async function listConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/list`);

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
      errorData.error || `Failed to fetch conversations: ${response.statusText}`
    );
  }

  return response.json();
}

export async function getConversationById(
  conversationId: string
): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/${conversationId}`);

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
      throw new Error('Note session not found');
    }
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to fetch conversation: ${response.statusText}`
    );
  }

  return response.json();
}

export interface SendMessageRequest {
  message: string;
  repository?: string;
  branchName?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message?: string;
  requestId?: string;
  conversationId?: string;
  timestamp?: string;
  error?: string;
}

export async function sendMessage(
  conversationId: string,
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/${conversationId}/message`, {
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

export interface CreateConversationRequest {
  queueType?: 'default' | 'telegram' | 'api';
}

export interface CreateConversationResponse {
  success: boolean;
  conversationId?: string;
  message?: string;
  queueType?: string;
  error?: string;
  timestamp?: string;
}

export async function createConversation(
  request?: CreateConversationRequest
): Promise<CreateConversationResponse> {
  const response = await fetch(`${API_BASE_URL}/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request || { queueType: 'api' }),
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
      errorData.error || `Failed to create conversation: ${response.statusText}`
    );
  }

  return response.json();
}
