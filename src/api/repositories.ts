/**
 * API client for repository file browser.
 */
import type { FileNode } from '../types/file-tree';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/conversations/api';

/**
 * Get file tree for a repository
 * @param repository - The repository name/identifier
 * @returns Promise resolving to FileNode[] tree structure
 * @throws Error if the API request fails
 */
export async function getRepositoryFiles(
  repository: string
): Promise<FileNode[]> {
  // Use /repositories/api/:repository/files endpoint
  // Note: This endpoint is served by cursor-runner, not through /conversations/api
  const baseUrl = API_BASE_URL.replace('/conversations/api', '/repositories/api');
  const response = await fetch(`${baseUrl}/${repository}/files`);

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
      throw new Error(`Repository '${repository}' not found`);
    }
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error || `Failed to fetch repository files: ${response.statusText}`
    );
  }

  return response.json();
}

