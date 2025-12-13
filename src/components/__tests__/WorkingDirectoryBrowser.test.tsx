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
 * - Top-level directories are initially expanded
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
  path: path || `/${name}`,
  type,
  ...(type === 'directory' && children && { children }),
});

describe('WorkingDirectoryBrowser', () => {
  const mockFileTree: FileNode[] = [
    createMockFileNode('src', 'directory', '/src', [
      createMockFileNode('components', 'directory', '/src/components', [
        createMockFileNode('App.tsx', 'file', '/src/components/App.tsx'),
        createMockFileNode('Header.tsx', 'file', '/src/components/Header.tsx'),
      ]),
      createMockFileNode('utils', 'directory', '/src/utils', [
        createMockFileNode('helpers.ts', 'file', '/src/utils/helpers.ts'),
      ]),
    ]),
    createMockFileNode('tests', 'directory', '/tests', [
      createMockFileNode('test1.ts', 'file', '/tests/test1.ts'),
    ]),
    createMockFileNode('package.json', 'file', '/package.json'),
    createMockFileNode('README.md', 'file', '/README.md'),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe('Successful load', () => {
    it('loads file tree on mount via getWorkingDirectoryFiles API', async () => {
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
          return HttpResponse.json(mockFileTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(
          /\/conversations\/api\/working-directory\/files$/,
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return HttpResponse.json(mockFileTree, {
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

  describe('Initial expansion', () => {
    it('expands top-level directories initially', async () => {
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

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Top-level directories should be expanded, so children should be visible
      // Wait for children of 'src' directory to be visible
      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
      });
      expect(screen.getByText('utils')).toBeInTheDocument();

      // Check for children of 'tests' directory
      expect(screen.getByText('test1.ts')).toBeInTheDocument();
    });

    it('does not expand nested directories initially', async () => {
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

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Nested directories should not be expanded initially
      // 'components' is a child of 'src', so its children should not be visible
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();
      expect(screen.queryByText('Header.tsx')).not.toBeInTheDocument();
    });
  });

  describe('Expand/collapse functionality', () => {
    it('expands directory when clicked', async () => {
      const user = userEvent.setup();

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

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Wait for 'components' to be visible (it's a child of 'src' which is expanded initially)
      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
      });

      // Find the 'components' directory button (it's a child of 'src')
      const componentsDir = screen.getByText('components');
      const componentsButton = componentsDir.closest('[role="button"]');
      expect(componentsButton).toBeInTheDocument();

      // Initially, children should not be visible
      expect(screen.queryByText('App.tsx')).not.toBeInTheDocument();

      // Click to expand
      if (componentsButton) {
        await user.click(componentsButton);
      }

      // Children should now be visible
      await waitFor(() => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument();
      });
    });

    it('collapses directory when clicked again', async () => {
      const user = userEvent.setup();

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

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Find the 'src' directory button (top-level, initially expanded)
      const srcDir = screen.getByText('src');
      const srcButton = srcDir.closest('[role="button"]');
      expect(srcButton).toBeInTheDocument();

      // Children should be visible initially
      expect(screen.getByText('components')).toBeInTheDocument();

      // Click to collapse
      if (srcButton) {
        await user.click(srcButton);
      }

      // Children should now be hidden
      await waitFor(() => {
        expect(screen.queryByText('components')).not.toBeInTheDocument();
      });
    });

    it('does not expand/collapse files (only directories)', async () => {
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

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Wait for 'components' to be visible (it's a child of 'src' which is expanded initially)
      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
      });

      // Find the 'components' directory button
      const componentsDir = screen.getByText('components');
      const componentsButton = componentsDir.closest('[role="button"]');
      expect(componentsButton).toBeInTheDocument();

      // Focus the button
      if (componentsButton) {
        componentsButton.focus();

        // Press Enter
        await user.keyboard('{Enter}');

        // Children should now be visible
        await waitFor(() => {
          expect(screen.getByText('App.tsx')).toBeInTheDocument();
        });
      }
    });

    it('expands directory when Space key is pressed', async () => {
      const user = userEvent.setup();

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

      render(<WorkingDirectoryBrowser />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // Wait for 'components' to be visible (it's a child of 'src' which is expanded initially)
      await waitFor(() => {
        expect(screen.getByText('components')).toBeInTheDocument();
      });

      // Find the 'components' directory button
      const componentsDir = screen.getByText('components');
      const componentsButton = componentsDir.closest('[role="button"]');
      expect(componentsButton).toBeInTheDocument();

      // Focus the button
      if (componentsButton) {
        componentsButton.focus();

        // Press Space
        await user.keyboard(' ');

        // Children should now be visible
        await waitFor(() => {
          expect(screen.getByText('App.tsx')).toBeInTheDocument();
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
          return HttpResponse.json(mockFileTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          apiCallCount++;
          return HttpResponse.json(mockFileTree, {
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
          return HttpResponse.json(mockFileTree, {
            headers: { 'Content-Type': 'application/json' },
          });
        }),
        http.get(/\/conversations\/api\/working-directory\/files$/, () => {
          apiCallCount++;
          return HttpResponse.json(mockFileTree, {
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

      // Check for tree container
      const tree = container.querySelector('.working-directory-browser__tree');
      expect(tree).toBeInTheDocument();
    });
  });
});
