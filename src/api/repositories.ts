/**
 * API client for repository file browser.
 */
import type { FileNode } from '../types/file-tree';

/**
 * Get file tree for the cursor working directory
 * @returns Promise resolving to FileNode[] tree structure
 * @throws Error if the API request fails
 */
export async function getWorkingDirectoryFiles(): Promise<FileNode[]> {
  // Use /api/working-directory/files endpoint
  // This endpoint uses TARGET_APP_PATH from cursor-runner (set to /cursor)
  const response = await fetch('/api/working-directory/files');

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
      throw new Error('Working directory not found');
    }
    const errorData = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(
      errorData.error ||
        `Failed to fetch working directory files: ${response.statusText}`
    );
  }

  return response.json();
}

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
  // This endpoint is served by cursor-runner directly
  const response = await fetch(`/repositories/api/${repository}/files`);

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
      errorData.error ||
        `Failed to fetch repository files: ${response.statusText}`
    );
  }

  return response.json();
}
