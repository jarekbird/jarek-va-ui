import type { Task } from '../types';

// Tasks API uses /api/tasks directly (not /conversations/api)
// This is different from conversations API which uses /conversations/api
const TASKS_API_BASE = '/api';

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
