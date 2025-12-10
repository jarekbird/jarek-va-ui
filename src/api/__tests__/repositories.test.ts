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
import { getWorkingDirectoryFiles, getRepositoryFiles } from '../repositories';
import type { FileNode } from '../../types/file-tree';
import { server } from '../../test/mocks/server';

// Mock fetch globally
const mockFetch = vi.fn();
// Mock global fetch
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('repositories API', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getWorkingDirectoryFiles', () => {
    const mockFileTree: FileNode[] = [
      {
        name: 'src',
        path: '/src',
        type: 'directory',
        children: [
          {
            name: 'App.tsx',
            path: '/src/App.tsx',
            type: 'file',
          },
        ],
      },
      {
        name: 'package.json',
        path: '/package.json',
        type: 'file',
      },
    ];

    it('fetches and returns file tree for working directory', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockFileTree,
      });

      const result = await getWorkingDirectoryFiles();
      expect(result).toEqual(mockFileTree);
      // Should use /api/working-directory/files when pathname is /
      expect(mockFetch).toHaveBeenCalledWith('/api/working-directory/files');
    });

    it('uses /conversations/api base path when in /conversations context', async () => {
      // Set pathname to /conversations
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
        json: async () => mockFileTree,
      });

      await getWorkingDirectoryFiles();
      // Should use /conversations/api/working-directory/files
      expect(mockFetch).toHaveBeenCalledWith(
        '/conversations/api/working-directory/files'
      );
    });

    it('uses /conversations/api base path when pathname starts with /conversations/', async () => {
      // Set pathname to /conversations/something
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/conversations/chat',
        },
        writable: true,
      });

      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockFileTree,
      });

      await getWorkingDirectoryFiles();
      // Should use /conversations/api/working-directory/files
      expect(mockFetch).toHaveBeenCalledWith(
        '/conversations/api/working-directory/files'
      );
    });

    it('throws "Working directory not found" error when response is 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Working directory not found' }),
      });

      await expect(getWorkingDirectoryFiles()).rejects.toThrow(
        'Working directory not found'
      );
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

      await expect(getWorkingDirectoryFiles()).rejects.toThrow(
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

      await expect(getWorkingDirectoryFiles()).rejects.toThrow(
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

      await expect(getWorkingDirectoryFiles()).rejects.toThrow(
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

      await expect(getWorkingDirectoryFiles()).rejects.toThrow(
        'Failed to fetch working directory files: Internal Server Error'
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
      await expect(getWorkingDirectoryFiles()).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(getWorkingDirectoryFiles()).rejects.toThrow('Network error');
    });

    it('truncates long non-JSON response text to 200 characters', async () => {
      const longText = 'A'.repeat(300);
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'text/plain' : null,
        },
        text: async () => longText,
      });

      try {
        await getWorkingDirectoryFiles();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Expected JSON but received text/plain');
        expect(errorMessage.length).toBeLessThanOrEqual(250); // 200 chars + prefix
      }
    });
  });

  describe('getRepositoryFiles', () => {
    const mockFileTree: FileNode[] = [
      {
        name: 'lib',
        path: '/lib',
        type: 'directory',
        children: [
          {
            name: 'utils.ts',
            path: '/lib/utils.ts',
            type: 'file',
          },
        ],
      },
      {
        name: 'package.json',
        path: '/package.json',
        type: 'file',
      },
    ];

    it('fetches and returns file tree for repository', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => mockFileTree,
      });

      const result = await getRepositoryFiles('my-repo');
      expect(result).toEqual(mockFileTree);
      expect(mockFetch).toHaveBeenCalledWith('/repositories/api/my-repo/files');
    });

    it('throws "Repository not found" error with repository name when response is 404', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({ error: 'Repository not found' }),
      });

      await expect(getRepositoryFiles('nonexistent-repo')).rejects.toThrow(
        "Repository 'nonexistent-repo' not found"
      );
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

      await expect(getRepositoryFiles('my-repo')).rejects.toThrow(
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

      await expect(getRepositoryFiles('my-repo')).rejects.toThrow(
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

      await expect(getRepositoryFiles('my-repo')).rejects.toThrow(
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

      await expect(getRepositoryFiles('my-repo')).rejects.toThrow(
        'Access denied'
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

      await expect(getRepositoryFiles('my-repo')).rejects.toThrow(
        'Failed to fetch repository files: Internal Server Error'
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
      await expect(getRepositoryFiles('my-repo')).rejects.toThrow(
        'Internal Server Error'
      );
    });

    it('handles network errors', async () => {
      (mockFetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(getRepositoryFiles('my-repo')).rejects.toThrow(
        'Network error'
      );
    });

    it('truncates long non-JSON response text to 200 characters', async () => {
      const longText = 'A'.repeat(300);
      (mockFetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (_name: string) =>
            _name === 'content-type' ? 'text/plain' : null,
        },
        text: async () => longText,
      });

      try {
        await getRepositoryFiles('my-repo');
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
