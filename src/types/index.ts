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
