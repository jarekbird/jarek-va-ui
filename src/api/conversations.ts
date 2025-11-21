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
      throw new Error('Conversation not found');
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
