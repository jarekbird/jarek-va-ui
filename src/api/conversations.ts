import type { Conversation } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/conversations/api';

/**
 * Parameters for fetching conversations with filters and pagination
 */
export interface FetchConversationsParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Filter by status */
  status?: string;
  /** Filter by agent */
  agent?: string;
  /** Filter by user */
  user?: string;
  /** Sort order */
  sortBy?: 'createdAt' | 'lastAccessedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response type for fetchConversations with pagination metadata
 */
export interface FetchConversationsResponse {
  conversations: Conversation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetches conversations with optional filter and pagination parameters.
 *
 * @param params - Optional filter and pagination parameters
 * @returns Promise resolving to conversations and pagination metadata
 */
export async function fetchConversations(
  params?: FetchConversationsParams
): Promise<FetchConversationsResponse> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.status) {
    queryParams.append('status', params.status);
  }
  if (params?.agent) {
    queryParams.append('agent', params.agent);
  }
  if (params?.user) {
    queryParams.append('user', params.user);
  }
  if (params?.sortBy) {
    queryParams.append('sortBy', params.sortBy);
  }
  if (params?.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder);
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/list${queryString ? `?${queryString}` : ''}`;

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
      errorData.error || `Failed to fetch conversations: ${response.statusText}`
    );
  }

  const data = await response.json();

  // If the response is an array (legacy format), wrap it in the new format
  if (Array.isArray(data)) {
    return {
      conversations: data,
      pagination:
        params?.page && params?.limit
          ? {
              page: params.page,
              limit: params.limit,
              total: data.length,
              totalPages: Math.ceil(data.length / params.limit),
            }
          : undefined,
    };
  }

  // If the response already has the new format, return it as-is
  return data;
}

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
