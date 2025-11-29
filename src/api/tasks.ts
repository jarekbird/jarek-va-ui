import type { Task } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

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
  if (params?.sortBy) {
    queryParams.append('sortBy', params.sortBy);
  }
  if (params?.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder);
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/tasks${queryString ? `?${queryString}` : ''}`;

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
  const response = await fetch(`${API_BASE_URL}/api/tasks`);

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

  return response.json();
}

export async function getTaskById(taskId: number): Promise<Task> {
  const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`);

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
