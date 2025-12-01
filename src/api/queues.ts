/**
 * Bull MQ Queue API
 * Fetches queue information from cursor-agents service
 */

export interface QueueInfo {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  agents: string[];
}

export interface QueuesResponse {
  queues: QueueInfo[];
}

// cursor-agents runs on port 3002, but we need to use the proxy path
// The API is at /agents/queues when behind Traefik
const QUEUES_API_BASE = '/agents';

export async function listQueues(): Promise<QueueInfo[]> {
  const response = await fetch(`${QUEUES_API_BASE}/queues`);

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
      errorData.error || `Failed to fetch queues: ${response.statusText}`
    );
  }

  const data: QueuesResponse = await response.json();
  return data.queues;
}

export async function getQueueInfo(queueName: string): Promise<QueueInfo> {
  const response = await fetch(`${QUEUES_API_BASE}/queues/${queueName}`);

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
      throw new Error('Queue not found');
    }
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to fetch queue info: ${response.statusText}`
    );
  }

  return response.json();
}
