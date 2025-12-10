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
import { listQueues, getQueueInfo } from '../queues';
import type { QueueInfo } from '../queues';
import { server } from '../../test/mocks/server';

// Mock fetch globally
const mockFetch = vi.fn();
// Mock global fetch
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('queues API', () => {
  // Disable MSW for this test suite since we use manual fetch mocks
  beforeAll(() => {
    server.close();
  });

  afterAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listQueues', () => {
    it('fetches and returns a list of queues', async () => {
      const mockQueues: QueueInfo[] = [
        {
          name: 'queue-1',
          waiting: 2,
          active: 1,
          completed: 100,
          failed: 0,
          delayed: 0,
          agents: ['agent-1', 'agent-2'],
        },
        {
          name: 'queue-2',
          waiting: 0,
          active: 0,
          completed: 50,
          failed: 1,
          delayed: 0,
          agents: ['agent-3'],
        },
      ];

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ queues: mockQueues }),
      });

      const result = await listQueues();
      expect(result).toEqual(mockQueues);
      expect(mockFetch).toHaveBeenCalledWith('/agents/queues');
    });

    it('throws an error when response is not JSON', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'text/plain' : null,
        },
        text: async () => 'Not JSON response',
      });

      await expect(listQueues()).rejects.toThrow(
        'Expected JSON but received text/plain'
      );
    });

    it('throws an error when content-type header is missing', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          get: (_name: string) => null,
        },
        text: async () => 'Response without content-type',
      });

      await expect(listQueues()).rejects.toThrow('Expected JSON but received');
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

      await expect(listQueues()).rejects.toThrow('Internal Server Error');
    });

    it('throws an error when fetch fails with 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Not Found' }),
      });

      await expect(listQueues()).rejects.toThrow('Not Found');
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

      await expect(listQueues()).rejects.toThrow(
        'Failed to fetch queues: Internal Server Error'
      );
    });

    it('handles error response that is not valid JSON', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // When JSON parsing fails, it falls back to statusText
      await expect(listQueues()).rejects.toThrow('Internal Server Error');
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(listQueues()).rejects.toThrow('Network error');
    });
  });

  describe('getQueueInfo', () => {
    const mockQueue: QueueInfo = {
      name: 'test-queue',
      waiting: 5,
      active: 2,
      completed: 200,
      failed: 1,
      delayed: 3,
      agents: ['agent-1', 'agent-2'],
    };

    it('fetches and returns queue information', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockQueue,
      });

      const result = await getQueueInfo('test-queue');
      expect(result).toEqual(mockQueue);
      expect(mockFetch).toHaveBeenCalledWith('/agents/queues/test-queue');
    });

    it('throws "Queue not found" error when response is 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Queue not found' }),
      });

      await expect(getQueueInfo('nonexistent-queue')).rejects.toThrow(
        'Queue not found'
      );
    });

    it('throws an error when response is not JSON', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'text/plain' : null,
        },
        text: async () => 'Not JSON response',
      });

      await expect(getQueueInfo('test-queue')).rejects.toThrow(
        'Expected JSON but received text/plain'
      );
    });

    it('throws an error when content-type header is missing', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          get: (_name: string) => null,
        },
        text: async () => 'Response without content-type',
      });

      await expect(getQueueInfo('test-queue')).rejects.toThrow(
        'Expected JSON but received'
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

      await expect(getQueueInfo('test-queue')).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('throws an error when fetch fails with 403', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Access denied' }),
      });

      await expect(getQueueInfo('test-queue')).rejects.toThrow('Access denied');
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

      await expect(getQueueInfo('test-queue')).rejects.toThrow(
        'Failed to fetch queue info: Internal Server Error'
      );
    });

    it('handles error response that is not valid JSON', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // When JSON parsing fails, it falls back to statusText
      await expect(getQueueInfo('test-queue')).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(getQueueInfo('test-queue')).rejects.toThrow('Network error');
    });

    it('truncates long non-JSON response text to 200 characters', async () => {
      const longText = 'A'.repeat(300);
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'text/plain' : null,
        },
        text: async () => longText,
      });

      try {
        await getQueueInfo('test-queue');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Expected JSON but received text/plain');
        expect(errorMessage.length).toBeLessThanOrEqual(250); // 200 chars + prefix
      }
    });
  });
});
