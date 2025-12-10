/**
 * MSW (Mock Service Worker) handlers for all API endpoints
 *
 * These handlers mock network requests in tests, allowing tests to run
 * without depending on a real backend server.
 *
 * Handlers support both `/api/*` and `/conversations/api/*` paths to match
 * the behavior of `getApiBasePath()` which returns different paths based on
 * the environment.
 */

import { http, HttpResponse } from 'msw';
import type { Conversation } from '../../types';
import type { AgentConversation } from '../../types/agent-conversation';
import type { Task } from '../../types';
import type { FileNode } from '../../types/file-tree';
import type { QueueInfo } from '../../api/queues';

// Mock data generators
const createMockConversation = (
  id: string,
  messageCount = 2
): Conversation => ({
  conversationId: id,
  messages: Array.from({ length: messageCount }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1}`,
    timestamp: new Date(Date.now() - (messageCount - i) * 1000).toISOString(),
  })),
  createdAt: new Date(Date.now() - messageCount * 1000).toISOString(),
  lastAccessedAt: new Date().toISOString(),
});

export const createMockAgentConversation = (
  id: string,
  messageCount = 2
): AgentConversation => ({
  conversationId: id,
  messages: Array.from({ length: messageCount }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Agent message ${i + 1}`,
    timestamp: new Date(Date.now() - (messageCount - i) * 1000).toISOString(),
    source: i % 2 === 0 ? 'text' : 'voice',
  })),
  createdAt: new Date(Date.now() - messageCount * 1000).toISOString(),
  lastAccessedAt: new Date().toISOString(),
  agentId: 'test-agent',
});

const createMockTask = (id: number): Task => ({
  id,
  prompt: `Test task ${id}`,
  status: 0,
  status_label: 'ready',
  createdat: new Date().toISOString(),
  updatedat: new Date().toISOString(),
  order: id,
  uuid: `task-uuid-${id}`,
});

const createMockQueueInfo = (name: string): QueueInfo => ({
  name,
  waiting: 5,
  active: 2,
  completed: 100,
  failed: 1,
  delayed: 0,
  agents: [`agent-${name}`],
});

const createMockFileNode = (
  name: string,
  type: 'file' | 'directory'
): FileNode => ({
  name,
  path: `/${name}`,
  type,
  ...(type === 'directory' && {
    children: [
      {
        name: `${name}-file1.ts`,
        path: `/${name}/${name}-file1.ts`,
        type: 'file',
      },
      {
        name: `${name}-file2.ts`,
        path: `/${name}/${name}-file2.ts`,
        type: 'file',
      },
    ],
  }),
});

// In-memory data stores for handlers
const conversations = new Map<string, Conversation>();
const agentConversations = new Map<string, AgentConversation>();
const tasks = new Map<number, Task>();
const queues = new Map<string, QueueInfo>();

// Initialize with some default data
conversations.set('conv-1', createMockConversation('conv-1'));
conversations.set('conv-2', createMockConversation('conv-2', 3));
agentConversations.set(
  'agent-conv-1',
  createMockAgentConversation('agent-conv-1')
);
agentConversations.set(
  'agent-conv-2',
  createMockAgentConversation('agent-conv-2', 4)
);
tasks.set(1, createMockTask(1));
tasks.set(2, createMockTask(2));
queues.set('default', createMockQueueInfo('default'));
queues.set('telegram', createMockQueueInfo('telegram'));

// Handler function for GET /api/tasks or /conversations/api/tasks
// Defined outside handlers array to avoid duplication
const handleGetTasks = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');
  const hasPagination = pageParam !== null || limitParam !== null;
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  const status = url.searchParams.get('status');
  const status_label = url.searchParams.get('status_label');
  // conversation_id is extracted but not currently used in filtering
  void url.searchParams.get('conversation_id');
  const sortBy = url.searchParams.get('sortBy');
  const sortOrder = url.searchParams.get('sortOrder') || 'desc';

  let tasksList = Array.from(tasks.values());

  // Apply filters
  if (status !== null) {
    tasksList = tasksList.filter((t) => t.status === parseInt(status, 10));
  }
  if (status_label) {
    tasksList = tasksList.filter((t) => t.status_label === status_label);
  }
  // conversation_id filter not implemented yet (not in current Task type)

  // Apply sorting
  if (sortBy) {
    tasksList.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortBy === 'createdat') {
        aValue = a.createdat ? new Date(a.createdat).getTime() : 0;
        bValue = b.createdat ? new Date(b.createdat).getTime() : 0;
      } else if (sortBy === 'updatedat') {
        aValue = a.updatedat ? new Date(a.updatedat).getTime() : 0;
        bValue = b.updatedat ? new Date(b.updatedat).getTime() : 0;
      } else {
        // order
        aValue = a.order;
        bValue = b.order;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Return in paginated format if page/limit query params provided, otherwise array
  if (hasPagination) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = tasksList.slice(start, end);
    const total = tasksList.length;

    return HttpResponse.json(
      {
        tasks: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Return array format for listTasks() which doesn't pass pagination params
  return HttpResponse.json(tasksList, {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const handlers = [
  // ============================================
  // Conversations API handlers
  // ============================================

  // GET /conversations/api/list or /api/conversations/list
  // Note: API tests use manual fetch mocks, so these handlers won't intercept those requests
  // Component tests that don't mock fetch will use these handlers
  http.get(/\/conversations\/api\/list$/, () => {
    const conversationsList = Array.from(conversations.values());
    return HttpResponse.json(conversationsList, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get(/\/api\/conversations\/list$/, () => {
    const conversationsList = Array.from(conversations.values());
    return HttpResponse.json(conversationsList, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // GET /conversations/api/:id or /api/conversations/:id
  http.get(/\/conversations\/api\/([^/]+)$/, ({ params }) => {
    const id = params[0] as string;
    const conversation = conversations.get(id);
    if (!conversation) {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return HttpResponse.json(conversation, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get(/\/api\/conversations\/([^/]+)$/, ({ params }) => {
    const id = params[0] as string;
    const conversation = conversations.get(id);
    if (!conversation) {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return HttpResponse.json(conversation, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // POST /conversations/api/new or /api/conversations/new
  http.post(/\/conversations\/api\/new$/, async ({ request }) => {
    const body = (await request.json()) as { queueType?: string };
    const newId = `conv-${Date.now()}`;
    const newConversation = createMockConversation(newId, 0);
    conversations.set(newId, newConversation);
    return HttpResponse.json(
      {
        success: true,
        conversationId: newId,
        queueType: body.queueType || 'api',
        timestamp: new Date().toISOString(),
      },
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  http.post(/\/api\/conversations\/new$/, async ({ request }) => {
    const body = (await request.json()) as { queueType?: string };
    const newId = `conv-${Date.now()}`;
    const newConversation = createMockConversation(newId, 0);
    conversations.set(newId, newConversation);
    return HttpResponse.json(
      {
        success: true,
        conversationId: newId,
        queueType: body.queueType || 'api',
        timestamp: new Date().toISOString(),
      },
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  // ============================================
  // Agent Conversations API handlers
  // ============================================

  // GET /agent-conversations/api/list
  http.get(/\/agent-conversations\/api\/list/, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const sortBy = url.searchParams.get('sortBy') || 'lastAccessedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const conversationsList = Array.from(agentConversations.values());

    // Sort conversations
    conversationsList.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortBy === 'messageCount') {
        aValue = a.messages.length;
        bValue = b.messages.length;
      } else if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else {
        // lastAccessedAt
        aValue = new Date(a.lastAccessedAt).getTime();
        bValue = new Date(b.lastAccessedAt).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const paginated = conversationsList.slice(offset, offset + limit);
    const total = conversationsList.length;

    return HttpResponse.json(
      {
        conversations: paginated,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  // GET /agent-conversations/api/:id
  http.get(/\/agent-conversations\/api\/([^/]+)$/, ({ params }) => {
    const id = params[0] as string;
    const conversation = agentConversations.get(id);
    if (!conversation) {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return HttpResponse.json(conversation, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // POST /agent-conversations/api/new
  http.post(/\/agent-conversations\/api\/new$/, async ({ request }) => {
    const body = (await request.json()) as {
      agentId?: string;
      metadata?: Record<string, unknown>;
    };
    const newId = `agent-conv-${Date.now()}`;
    const newConversation = createMockAgentConversation(newId, 0);
    if (body.agentId) {
      newConversation.agentId = body.agentId;
    }
    if (body.metadata) {
      newConversation.metadata = body.metadata;
    }
    agentConversations.set(newId, newConversation);
    return HttpResponse.json(
      {
        success: true,
        conversationId: newId,
        timestamp: new Date().toISOString(),
      },
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  // POST /agent-conversations/api/:id/message
  http.post(
    /\/agent-conversations\/api\/([^/]+)\/message$/,
    async ({ params }) => {
      const id = params[0] as string;
      const conversation = agentConversations.get(id);
      if (!conversation) {
        return HttpResponse.json(
          { error: 'Conversation not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // In a real scenario, this would add the message to the conversation
      return HttpResponse.json(
        {
          success: true,
          conversationId: id,
          message: 'Message sent',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  ),

  // ============================================
  // Tasks API handlers
  // ============================================

  // GET /api/tasks or /conversations/api/tasks
  http.get(/\/api\/tasks$/, handleGetTasks),
  http.get(/\/conversations\/api\/tasks$/, handleGetTasks),

  // GET /api/tasks/:id or /conversations/api/tasks/:id
  http.get(/\/api\/tasks\/(\d+)$/, ({ params }) => {
    const id = parseInt(params[0] as string, 10);
    const task = tasks.get(id);
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return HttpResponse.json(task, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get(/\/conversations\/api\/tasks\/(\d+)$/, ({ params }) => {
    const id = parseInt(params[0] as string, 10);
    const task = tasks.get(id);
    if (!task) {
      return HttpResponse.json(
        { error: 'Task not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return HttpResponse.json(task, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // POST /api/tasks or /conversations/api/tasks
  http.post(/\/api\/tasks$/, async ({ request }) => {
    const body = (await request.json()) as { prompt: string };
    const newId = tasks.size + 1;
    const newTask = createMockTask(newId);
    newTask.prompt = body.prompt;
    tasks.set(newId, newTask);
    return HttpResponse.json(newTask, {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.post(/\/conversations\/api\/tasks$/, async ({ request }) => {
    const body = (await request.json()) as { prompt: string };
    const newId = tasks.size + 1;
    const newTask = createMockTask(newId);
    newTask.prompt = body.prompt;
    tasks.set(newId, newTask);
    return HttpResponse.json(newTask, {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // ============================================
  // Queues API handlers
  // ============================================

  // GET /agents/queues
  http.get('/agents/queues', () => {
    const queuesList = Array.from(queues.values());
    return HttpResponse.json(
      { queues: queuesList },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  // GET /agents/queues/:name
  http.get(/\/agents\/queues\/([^/]+)$/, ({ params }) => {
    const name = params[0] as string;
    const queue = queues.get(name);
    if (!queue) {
      return HttpResponse.json(
        { error: 'Queue not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return HttpResponse.json(queue, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // ============================================
  // Repository/Working Directory API handlers
  // ============================================

  // GET /api/working-directory/files or /conversations/api/working-directory/files
  http.get(/\/api\/working-directory\/files$/, () => {
    const fileTree: FileNode[] = [
      createMockFileNode('src', 'directory'),
      createMockFileNode('tests', 'directory'),
      { name: 'package.json', path: '/package.json', type: 'file' },
      { name: 'README.md', path: '/README.md', type: 'file' },
    ];
    return HttpResponse.json(fileTree, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get(/\/conversations\/api\/working-directory\/files$/, () => {
    const fileTree: FileNode[] = [
      createMockFileNode('src', 'directory'),
      createMockFileNode('tests', 'directory'),
      { name: 'package.json', path: '/package.json', type: 'file' },
      { name: 'README.md', path: '/README.md', type: 'file' },
    ];
    return HttpResponse.json(fileTree, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // GET /repositories/api/:repository/files
  http.get(/\/repositories\/api\/([^/]+)\/files$/, ({ params }) => {
    // Extract repository name from params (currently unused but available for future filtering)
    void params[0];
    // Return a mock file tree for the repository
    const fileTree: FileNode[] = [
      createMockFileNode('src', 'directory'),
      createMockFileNode('lib', 'directory'),
      { name: 'package.json', path: '/package.json', type: 'file' },
    ];
    return HttpResponse.json(fileTree, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  // GET /config (Agent Config endpoint)
  http.get(/\/config$/, () => {
    const mockConfig = {
      agentId: 'test-agent-id',
      agentUrl: 'http://localhost:8000',
      cursorRunnerUrl: 'http://localhost:3000',
      webhookSecretConfigured: true,
      redisUrl: 'redis://localhost:6379',
      hasApiKey: true,
    };
    return HttpResponse.json(
      { success: true, config: mockConfig },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }),

  // GET /config/health (Agent Health endpoint)
  http.get(/\/config\/health$/, () => {
    const mockHealth = {
      service: 'ok',
      status: 'ok',
      dependencies: {
        redis: 'connected',
        cursorRunner: 'connected',
      },
      timestamp: new Date().toISOString(),
    };
    return HttpResponse.json(mockHealth, {
      headers: { 'Content-Type': 'application/json' },
    });
  }),
];
