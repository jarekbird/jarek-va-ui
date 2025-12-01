import type { Task } from '../types';

// Tasks API uses /api/tasks directly (not /conversations/api)
// This is different from conversations API which uses /conversations/api
const TASKS_API_BASE = '/api';

/**
 * Parameters for fetching tasks with filters and pagination
 */
export interface FetchTasksParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Filter by status */
  status?: number;
  /** Filter by status label */
  status_label?: 'ready' | 'complete' | 'archived' | 'backlogged' | 'unknown';
  /** Filter by conversation ID */
  conversation_id?: string;
  /** Sort order */
  sortBy?: 'createdat' | 'updatedat' | 'order';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response type for fetchTasks with pagination metadata
 */
export interface FetchTasksResponse {
  tasks: Task[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetches tasks with optional filter and pagination parameters.
 *
 * @param params - Optional filter and pagination parameters
 * @returns Promise resolving to tasks and pagination metadata
 */
export async function fetchTasks(
  params?: FetchTasksParams
): Promise<FetchTasksResponse> {
  // Build query string from params
  const queryParams = new URLSearchParams();

  if (params?.page) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.status !== undefined) {
    queryParams.append('status', params.status.toString());
  }
  if (params?.status_label) {
    queryParams.append('status_label', params.status_label);
  }
  if (params?.conversation_id) {
    queryParams.append('conversation_id', params.conversation_id);
  }
  if (params?.sortBy) {
    queryParams.append('sortBy', params.sortBy);
  }
  if (params?.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder);
  }

  const queryString = queryParams.toString();
  const url = `${TASKS_API_BASE}/tasks${queryString ? `?${queryString}` : ''}`;

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
      errorData.error || `Failed to fetch tasks: ${response.statusText}`
    );
  }

  const data = await response.json();

  // If the response is an array (legacy format), wrap it in the new format
  if (Array.isArray(data)) {
    return {
      tasks: data,
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

export async function listTasks(): Promise<Task[]> {
  const url = `${TASKS_API_BASE}/tasks`;
  console.log('[tasks API] Fetching tasks from:', url);

  try {
    const response = await fetch(url);
    console.log(
      '[tasks API] Response status:',
      response.status,
      response.statusText
    );
    console.log(
      '[tasks API] Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    // Check if response is actually JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[tasks API] Non-JSON response:', {
        contentType,
        text: text.substring(0, 500),
      });
      throw new Error(
        `Expected JSON but received ${contentType}. Response: ${text.substring(0, 200)}`
      );
    }

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      console.error('[tasks API] Error response:', errorData);
      throw new Error(
        errorData.error || `Failed to fetch tasks: ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('[tasks API] Successfully parsed response:', {
      isArray: Array.isArray(data),
      count: Array.isArray(data) ? data.length : 'not an array',
      data: Array.isArray(data) ? data : 'not an array',
    });

    if (!Array.isArray(data)) {
      console.warn('[tasks API] Response is not an array:', data);
      return [];
    }

    return data;
  } catch (error) {
    console.error('[tasks API] Fetch error:', error);
    throw error;
  }
}

/**
 * Fetches a single task by ID.
 * This is an alias for getTaskById to maintain consistency with fetchTasks.
 *
 * @param taskId - The ID of the task to fetch
 * @returns Promise resolving to the task
 */
export async function fetchTask(taskId: number): Promise<Task> {
  return getTaskById(taskId);
}

export async function getTaskById(taskId: number): Promise<Task> {
  const response = await fetch(`${TASKS_API_BASE}/tasks/${taskId}`);

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
      throw new Error('Task not found');
    }
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to fetch task: ${response.statusText}`
    );
  }

  return response.json();
}

export async function createTask(prompt: string): Promise<Task> {
  const response = await fetch(`${TASKS_API_BASE}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
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
      errorData.error || `Failed to create task: ${response.statusText}`
    );
  }

  return response.json();
}
