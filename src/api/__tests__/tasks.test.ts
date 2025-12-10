import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import {
  fetchTasks,
  listTasks,
  getTaskById,
  fetchTask,
  createTask,
} from '../tasks';
import type { Task } from '../../types';
import { server } from '../../test/mocks/server';

// Mock fetch globally
const mockFetch = vi.fn();
// Mock global fetch
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('tasks API', () => {
  // Disable MSW for this test suite since we use manual fetch mocks
  beforeAll(() => {
    server.close();
  });

  afterAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location for getApiBasePath
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/',
      },
      writable: true,
    });
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchTasks', () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        prompt: 'Task 1',
        status: 0,
        status_label: 'ready',
        createdat: '2024-01-01T00:00:00Z',
        updatedat: '2024-01-01T00:00:00Z',
        order: 1,
        uuid: 'uuid-1',
      },
      {
        id: 2,
        prompt: 'Task 2',
        status: 1,
        status_label: 'complete',
        createdat: '2024-01-02T00:00:00Z',
        updatedat: '2024-01-02T00:00:00Z',
        order: 2,
        uuid: 'uuid-2',
      },
    ];

    it('fetches tasks without parameters', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ tasks: mockTasks }),
      });

      const result = await fetchTasks();
      expect(result.tasks).toEqual(mockTasks);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks');
    });

    it('fetches tasks with pagination parameters', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          tasks: mockTasks,
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1,
          },
        }),
      });

      const result = await fetchTasks({ page: 1, limit: 10 });
      expect(result.tasks).toEqual(mockTasks);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks?page=1&limit=10');
    });

    it('fetches tasks with status filter', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ tasks: [mockTasks[0]] }),
      });

      const result = await fetchTasks({ status: 0 });
      expect(result.tasks).toEqual([mockTasks[0]]);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks?status=0');
    });

    it('fetches tasks with status_label filter', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ tasks: [mockTasks[1]] }),
      });

      const result = await fetchTasks({ status_label: 'complete' });
      expect(result.tasks).toEqual([mockTasks[1]]);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tasks?status_label=complete'
      );
    });

    it('fetches tasks with conversation_id filter', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ tasks: mockTasks }),
      });

      const result = await fetchTasks({ conversation_id: 'conv-123' });
      expect(result.tasks).toEqual(mockTasks);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tasks?conversation_id=conv-123'
      );
    });

    it('fetches tasks with sorting parameters', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ tasks: mockTasks }),
      });

      const result = await fetchTasks({
        sortBy: 'createdat',
        sortOrder: 'asc',
      });
      expect(result.tasks).toEqual(mockTasks);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/tasks?sortBy=createdat&sortOrder=asc'
      );
    });

    it('fetches tasks with multiple parameters', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ tasks: [mockTasks[0]] }),
      });

      const result = await fetchTasks({
        page: 1,
        limit: 10,
        status: 0,
        status_label: 'ready',
        sortBy: 'order',
        sortOrder: 'desc',
      });
      expect(result.tasks).toEqual([mockTasks[0]]);
      // Check that all parameters are in the URL
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('limit=10');
      expect(callUrl).toContain('status=0');
      expect(callUrl).toContain('status_label=ready');
      expect(callUrl).toContain('sortBy=order');
      expect(callUrl).toContain('sortOrder=desc');
    });

    it('handles array response format (legacy)', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockTasks, // Array format
      });

      const result = await fetchTasks({ page: 1, limit: 10 });
      expect(result.tasks).toEqual(mockTasks);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('handles array response format without pagination params', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockTasks, // Array format
      });

      const result = await fetchTasks();
      expect(result.tasks).toEqual(mockTasks);
      expect(result.pagination).toBeUndefined();
    });

    it('uses /conversations/api base path when in /conversations context', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/conversations',
        },
        writable: true,
      });

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ tasks: mockTasks }),
      });

      await fetchTasks();
      expect(mockFetch).toHaveBeenCalledWith('/conversations/api/tasks');
    });

    it('throws an error when response is not JSON', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'text/plain' : null,
        },
        text: async () => 'Not JSON response',
      });

      await expect(fetchTasks()).rejects.toThrow(
        'Expected JSON but received text/plain'
      );
    });

    it('throws an error when fetch fails with 500', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Internal Server Error' }),
      });

      await expect(fetchTasks()).rejects.toThrow('Internal Server Error');
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(fetchTasks()).rejects.toThrow('Network error');
    });
  });

  describe('listTasks', () => {
    const mockTasks: Task[] = [
      {
        id: 1,
        prompt: 'Task 1',
        status: 0,
        status_label: 'ready',
        createdat: '2024-01-01T00:00:00Z',
        updatedat: '2024-01-01T00:00:00Z',
        order: 1,
        uuid: 'uuid-1',
      },
    ];

    it('fetches and returns a list of tasks', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
          entries: () => [['content-type', 'application/json']],
        },
        json: async () => mockTasks,
      });

      const result = await listTasks();
      expect(result).toEqual(mockTasks);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks');
    });

    it('returns empty array when response is not an array', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
          entries: () => [['content-type', 'application/json']],
        },
        json: async () => ({ tasks: mockTasks }), // Object format, not array
      });

      const result = await listTasks();
      expect(result).toEqual([]);
    });

    it('throws an error when response is not JSON', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'text/plain' : null,
          entries: () => [['content-type', 'text/plain']],
        },
        text: async () => 'Not JSON response',
      });

      await expect(listTasks()).rejects.toThrow(
        'Expected JSON but received text/plain'
      );
    });

    it('throws an error when fetch fails with 500', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
          entries: () => [['content-type', 'application/json']],
        },
        json: async () => ({ error: 'Internal Server Error' }),
      });

      await expect(listTasks()).rejects.toThrow('Internal Server Error');
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(listTasks()).rejects.toThrow('Network error');
    });
  });

  describe('getTaskById', () => {
    const mockTask: Task = {
      id: 1,
      prompt: 'Test task',
      status: 0,
      status_label: 'ready',
      createdat: '2024-01-01T00:00:00Z',
      updatedat: '2024-01-01T00:00:00Z',
      order: 1,
      uuid: 'uuid-1',
    };

    it('fetches and returns a task by ID', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockTask,
      });

      const result = await getTaskById(1);
      expect(result).toEqual(mockTask);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1');
    });

    it('throws "Task not found" error when response is 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Task not found' }),
      });

      await expect(getTaskById(999)).rejects.toThrow('Task not found');
    });

    it('throws an error when response is not JSON', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'text/plain' : null,
        },
        text: async () => 'Not JSON response',
      });

      await expect(getTaskById(1)).rejects.toThrow(
        'Expected JSON but received text/plain'
      );
    });

    it('throws an error when fetch fails with 500', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Internal Server Error' }),
      });

      await expect(getTaskById(1)).rejects.toThrow('Internal Server Error');
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(getTaskById(1)).rejects.toThrow('Network error');
    });
  });

  describe('fetchTask', () => {
    const mockTask: Task = {
      id: 1,
      prompt: 'Test task',
      status: 0,
      status_label: 'ready',
      createdat: '2024-01-01T00:00:00Z',
      updatedat: '2024-01-01T00:00:00Z',
      order: 1,
      uuid: 'uuid-1',
    };

    it('fetches and returns a task by ID (alias for getTaskById)', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockTask,
      });

      const result = await fetchTask(1);
      expect(result).toEqual(mockTask);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks/1');
    });

    it('throws "Task not found" error when response is 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Task not found' }),
      });

      await expect(fetchTask(999)).rejects.toThrow('Task not found');
    });
  });

  describe('createTask', () => {
    const mockTask: Task = {
      id: 1,
      prompt: 'New task',
      status: 0,
      status_label: 'ready',
      createdat: '2024-01-01T00:00:00Z',
      updatedat: '2024-01-01T00:00:00Z',
      order: 1,
      uuid: 'uuid-1',
    };

    it('creates a task with prompt', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockTask,
      });

      const result = await createTask('New task');
      expect(result).toEqual(mockTask);
      expect(mockFetch).toHaveBeenCalledWith('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'New task' }),
      });
    });

    it('throws an error when response is not JSON', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'text/plain' : null,
        },
        text: async () => 'Not JSON response',
      });

      await expect(createTask('New task')).rejects.toThrow(
        'Expected JSON but received text/plain'
      );
    });

    it('throws an error when fetch fails with 400', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Invalid prompt' }),
      });

      await expect(createTask('')).rejects.toThrow('Invalid prompt');
    });

    it('throws an error when fetch fails with 500', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Internal Server Error' }),
      });

      await expect(createTask('New task')).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('falls back to statusText when error response has no error field', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({}), // Empty object so it falls back to statusText
      });

      await expect(createTask('New task')).rejects.toThrow(
        'Failed to create task: Internal Server Error'
      );
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(createTask('New task')).rejects.toThrow('Network error');
    });
  });
});
