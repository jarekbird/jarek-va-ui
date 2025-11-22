export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

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
