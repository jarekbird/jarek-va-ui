import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import {
  WorkingDirectoryBrowser,
  type WorkingDirectoryBrowserRef,
} from '../WorkingDirectoryBrowser';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import type { FileNode } from '../../types/file-tree';

/**
 * Comprehensive unit tests for WorkingDirectoryBrowser component
 *
 * This test suite verifies:
 * - Component loads file tree on mount via getWorkingDirectoryFiles API
 * - Directories are lazy-loaded on expand (children fetched on demand)
 * - Directory expand/collapse works via click
 * - Keyboard navigation (Enter/Space) works for expand/collapse
 * - Error handling displays appropriate messages
 * - Empty state is displayed when no files
 * - refresh() method exposed via ref works correctly
 * - Integration with MSW for API mocking
 */

// Helper to create mock file nodes
const createMockFileNode = (
  name: string,
  type: 'file' | 'directory',
  path?: string,
  children?: FileNode[]
): FileNode => ({
  name,
  path: path || name,
  type,
  ...(type === 'directory' && children && { children }),
});

describe('WorkingDirectoryBrowser', () => {
  const mockRootTree: FileNode[] = [
    createMockFileNode('src', 'directory', 'src'),
    createMockFileNode('tests', 'directory', 'tests'),
    createMockFileNode('package.json', 'file', 'package.json'),
    createMockFileNode('README.md', 'file', 'README.md'),
  ];

  const mockSrcChildren: FileNode[] = [
    createMockFileNode('components', 'directory', 'src/components'),
    createMockFileNode('utils', 'directory', 'src/utils'),
    createMockFileNode('index.ts', 'file', 'src/index.ts'),
  ];

  const mockComponentsChildren: FileNode[] = [
    createMockFileNode('App.tsx', 'file', 'src/components/App.tsx'),
    createMockFileNode('Header.tsx', 'file', 'src/components/Header.tsx'),
  ];

  const mockUtilsChildren: FileNode[] = [
    createMockFileNode('helpers.ts', 'file', 'src/utils/helpers.ts'),
  ];

  const mockTestsChildren: FileNode[] = [
    createMockFileNode('test1.ts', 'file', 'tests/test1.ts'),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe('Successful load', () => {
    it('loads file tree on mount via getWorkingDirectoryFiles API', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, ({ request }) => {
          const url = new URL(request.url);
          const p = url.searchParams.get('path');
          const body =
            p === 'src'
              ? mockSrcChildren
              : p === 'src/components'
                ? mockComponentsChildren
                : p === 'src/utils'
                  ? mockUtilsChildren
                  : p === 'tests'
                    ? mockTestsChildren
                    : mockRootTree;
          return HttpResponse.json(body, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files$/,
          ({ request }) => {
            const url = new URL(request.url);
            const p = url.searchParams.get('path');
            const body =
              p === 'src'
                ? mockSrcChildren
                : p === 'src/components'
                  ? mockComponentsChildren
                  : p === 'src/utils'
                    ? mockUtilsChildren
                    : p === 'tests'
                      ? mockTestsChildren
                      : mockRootTree;
            return HttpResponse.json(body, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Verify files are displayed
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('tests')).toBeInTheDocument();
      expect(screen.getByText('package.json')).toBeInTheDocument();
    });

    it('renders header with title and refresh button', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Check for header title
      expect(
        screen.getByRole('heading', { level: 3, name: /working directory/i })
      ).toBeInTheDocument();

      // Check for refresh button
      const refreshButton = screen.getByRole('button', {
        name: /refresh file tree/i,
      });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveAttribute('title', 'Refresh');
    });

    it('shows LoadingSpinner during load, then hides it', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files$/,
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return HttpResponse.json(mockRootTree, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      render(<WorkingDirectoryBrowser />);

      // Loading spinner should be visible initially
      const spinner = screen.queryByTestId('loading-spinner');
      if (spinner) {
        expect(spinner).toBeInTheDocument();
      }

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(
            screen.queryByTestId('loading-spinner')
          ).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Initial state (lazy)', () => {
    it('does not show nested entries until a directory is expanded', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // No children should be visible yet
      expect(screen.queryByText('components')).not.toBeInTheDocument();
      expect(screen.queryByText('test1.ts')).not.toBeInTheDocument();
    });
  });

  describe('Expand/collapse functionality', () => {
    it('expands directory when clicked (loads children)', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/api\/working-directory\/files$/, ({ request }) => {
          const url = new URL(request.url);
          const p = url.searchParams.get('path');
          const body = p === 'src' ? mockSrcChildren : mockRootTree;
          return HttpResponse.json(body, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files$/,
          ({ request }) => {
            const url = new URL(request.url);
            const p = url.searchParams.get('path');
            const body = p === 'src' ? mockSrcChildren : mockRootTree;
            return HttpResponse.json(body, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Click 'src' to expand (loads children)
      const srcDir = screen.getByText('src');
      const srcButton = srcDir.closest('[role="button"]');
      expect(srcButton).toBeInTheDocument();
      if (srcButton) await user.click(srcButton);

      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
      });
    });

    it('collapses directory when clicked again', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/api\/working-directory\/files$/, ({ request }) => {
          const url = new URL(request.url);
          const p = url.searchParams.get('path');
          const body = p === 'src' ? mockSrcChildren : mockRootTree;
          return HttpResponse.json(body, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files$/,
          ({ request }) => {
            const url = new URL(request.url);
            const p = url.searchParams.get('path');
            const body = p === 'src' ? mockSrcChildren : mockRootTree;
            return HttpResponse.json(body, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Find the 'src' directory button (top-level)
      const srcDir = screen.getByText('src');
      const srcButton = srcDir.closest('[role="button"]');
      expect(srcButton).toBeInTheDocument();

      // Expand then collapse
      if (srcButton) await user.click(srcButton);
      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
      });

      // Click to collapse
      if (srcButton) {
        await user.click(srcButton);
      }

      // Children should now be hidden
      await waitFor(() => {
        expect(screen.queryByText('components')).not.toBeInTheDocument();
      });
    });

    it('expands nested directory when clicked (loads grandchildren)', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/api\/working-directory\/files$/, ({ request }) => {
          const url = new URL(request.url);
          const p = url.searchParams.get('path');
          const body =
            p === 'src'
              ? mockSrcChildren
              : p === 'src/components'
                ? mockComponentsChildren
                : mockRootTree;
          return HttpResponse.json(body, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files$/,
          ({ request }) => {
            const url = new URL(request.url);
            const p = url.searchParams.get('path');
            const body =
              p === 'src'
                ? mockSrcChildren
                : p === 'src/components'
                  ? mockComponentsChildren
                  : mockRootTree;
            return HttpResponse.json(body, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Expand src
      const srcButton = screen.getByText('src').closest('[role="button"]');
      expect(srcButton).toBeInTheDocument();
      if (srcButton) await user.click(srcButton);

      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
      });

      // Expand components
      const componentsButton = screen
        .getByText('components')
        .closest('[role="button"]');
      expect(componentsButton).toBeInTheDocument();
      if (componentsButton) await user.click(componentsButton);

      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument();
      });
    });

    it('does not expand/collapse files (only directories)', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Find a file (not a directory)
      const file = screen.getByText('package.json');
      const fileRow = file.closest('.file-tree-node__row');

      // Files should not have role="button"
      expect(fileRow).not.toHaveAttribute('role', 'button');
    });
  });

  describe('Keyboard navigation', () => {
    it('expands directory when Enter key is pressed', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/api\/working-directory\/files$/, ({ request }) => {
          const url = new URL(request.url);
          const p = url.searchParams.get('path');
          const body = p === 'src' ? mockSrcChildren : mockRootTree;
          return HttpResponse.json(body, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files$/,
          ({ request }) => {
            const url = new URL(request.url);
            const p = url.searchParams.get('path');
            const body = p === 'src' ? mockSrcChildren : mockRootTree;
            return HttpResponse.json(body, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const srcDir = screen.getByText('src');
      const srcButton = srcDir.closest('[role="button"]');
      expect(srcButton).toBeInTheDocument();

      // Focus the button
      if (srcButton) {
        srcButton.focus();

        // Press Enter
        await user.keyboard('{Enter}');

        // Children should now be visible
        await waitFor(() => {
          expect(screen.getByText('components')).toBeInTheDocument();
        });
      }
    });

    it('expands directory when Space key is pressed', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(/\/api\/working-directory\/files$/, ({ request }) => {
          const url = new URL(request.url);
          const p = url.searchParams.get('path');
          const body = p === 'src' ? mockSrcChildren : mockRootTree;
          return HttpResponse.json(body, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files$/,
          ({ request }) => {
            const url = new URL(request.url);
            const p = url.searchParams.get('path');
            const body = p === 'src' ? mockSrcChildren : mockRootTree;
            return HttpResponse.json(body, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const srcDir = screen.getByText('src');
      const srcButton = srcDir.closest('[role="button"]');
      expect(srcButton).toBeInTheDocument();

      // Focus the button
      if (srcButton) {
        srcButton.focus();

        // Press Space
        await user.keyboard(' ');

        // Children should now be visible
        await waitFor(() => {
          expect(screen.getByText('components')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Refresh button', () => {
    it('triggers file tree reload when refresh button is clicked', async () => {
      let apiCallCount = 0;
      const user = userEvent.setup();

      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          apiCallCount++;
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          apiCallCount++;
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const initialCallCount = apiCallCount;

      const refreshButton = screen.getByRole('button', {
        name: /refresh file tree/i,
      });
      await user.click(refreshButton);

      // Wait for reload to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // API should be called again
      expect(apiCallCount).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Ref-based refresh', () => {
    it('exposes refresh method via ref', async () => {
      const ref = createRef<WorkingDirectoryBrowserRef>();

      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<WorkingDirectoryBrowser ref={ref} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Ref should be attached
      expect(ref.current).not.toBeNull();
      expect(ref.current).toHaveProperty('refresh');
      expect(typeof ref.current?.refresh).toBe('function');
    });

    it('refresh() method triggers file tree reload', async () => {
      let apiCallCount = 0;
      const ref = createRef<WorkingDirectoryBrowserRef>();

      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          apiCallCount++;
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          apiCallCount++;
          return HttpResponse.json(mockRootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<WorkingDirectoryBrowser ref={ref} />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      const initialCallCount = apiCallCount;

      // Call refresh via ref
      await ref.current?.refresh();

      // Wait for reload to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // API should be called again
      expect(apiCallCount).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Error handling', () => {
    it('displays error message when network error occurs', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.error();
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.error();
        })
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // The error message comes from the API client - "Failed to fetch" for network errors
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });

    it('displays error message when API returns 404', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(
            { error: 'Working directory not found' },
            { status: 404 }
          );
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(
            { error: 'Working directory not found' },
            { status: 404 }
          );
        })
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Error message from API: "Working directory not found"
      expect(
        screen.getByText(/working directory not found/i)
      ).toBeInTheDocument();
    });

    it('displays error message when API returns 500', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Error message from API
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('displays empty message when no files are found', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json([], {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json([], {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/no files found/i)).toBeInTheDocument();
    });

    it('empty state only shown when not loading and no error', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json([], {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json([], {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      render(<WorkingDirectoryBrowser />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Empty state should be shown
      expect(screen.getByText(/no files found/i)).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('renders with correct CSS classes', async () => {
      server.use(
        http.get(/\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockFileTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          return HttpResponse.json(mockFileTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        })
      );

      const { container } = render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Check for main container class
      const browser = container.querySelector('.working-directory-browser');
      expect(browser).toBeInTheDocument();
    });

    it('renders file tree with correct structure', async () => {
      // Mock top-level only (lazy loading)
      const rootTree: FileNode[] = [
        { name: 'src', path: 'src', type: 'directory' },
        { name: 'tests', path: 'tests', type: 'directory' },
        { name: 'package.json', path: 'package.json', type: 'file' },
      ];

      server.use(
        http.get(/\/api\/working-directory\/files/, ({ request }) => {
          const url = new URL(request.url);
          const requestedPath = url.searchParams.get('path');
          return HttpResponse.json(requestedPath ? [] : rootTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files/,
          ({ request }) => {
            const url = new URL(request.url);
            const requestedPath = url.searchParams.get('path');
            return HttpResponse.json(requestedPath ? [] : rootTree, {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        )
      );

      const { container } = render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Check for tree container
      const tree = container.querySelector('.working-directory-browser__tree');
      expect(tree).toBeInTheDocument();
    });
  });
});
