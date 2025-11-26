export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/**
 * Conversation interface for note-taking sessions.
 * Note: The term "Conversation" is used internally for backward compatibility with the API,
 * but these are displayed as "Note Taking History" in the UI.
 */
export interface Conversation {
  conversationId: string;
  messages: Message[];
  createdAt: string;
  lastAccessedAt: string;
}

export interface Task {
  id: number;
  prompt: string;
  status: number;
  status_label: 'ready' | 'complete' | 'archived' | 'backlogged' | 'unknown';
  createdat: string | null;
  updatedat: string | null;
  order: number;
  uuid: string | null;
}
