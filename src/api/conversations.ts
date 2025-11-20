import type { Conversation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/conversations/api';

export async function listConversations(): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/list`);
  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.statusText}`);
  }
  return response.json();
}

export async function getConversationById(
  conversationId: string
): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/${conversationId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Conversation not found');
    }
    throw new Error(`Failed to fetch conversation: ${response.statusText}`);
  }
  return response.json();
}

