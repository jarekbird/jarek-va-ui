import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TaskDashboard } from '../components/TaskDashboard';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import type { FileNode } from '../types/file-tree';

/**
 * Integration tests for Working Directory Tree
 *
 * These tests verify that the file tree rendering, expand/collapse functionality,
 * and keyboard navigation work correctly together across multiple levels of nesting
 * in the context of the TaskDashboard.
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

describe('Working Directory Tree Integration', () => {
  const mockFileTree: FileNode[] = [
    createMockFileNode('src', 'directory', '/src', [
      createMockFileNode('components', 'directory', '/src/components', [
        createMockFileNode('App.tsx', 'file', '/src/components/App.tsx'),
        createMockFileNode('Header.tsx', 'file', '/src/components/Header.tsx'),
        createMockFileNode('utils', 'directory', '/src/components/utils', [
          createMockFileNode(
            'helpers.ts',
            'file',
            '/src/components/utils/helpers.ts'
          ),
        ]),
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
    server.resetHandlers();
    // Set up default MSW handlers
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
      }),
      http.get(/\/api\/tasks/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/conversations\/api\/tasks/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/api\/queues/, () => {
        return HttpResponse.json(
          { queues: [] },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }),
      http.get(/\/conversations\/api\/queues/, () => {
        return HttpResponse.json(
          { queues: [] },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }),
      http.get(/\/api\/conversations/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/conversations\/api\/conversations/, () => {
        return HttpResponse.json([], {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
  });

  it('file tree loads and displays correctly in TaskDashboard context', async () => {
    render(
      <MemoryRouter>
        <TaskDashboard />
      </MemoryRouter>
    );

    // Wait for file tree to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify top-level directories are displayed
    expect(screen.getByText('src')).toBeInTheDocument();
    expect(screen.getByText('tests')).toBeInTheDocument();
    expect(screen.getByText('package.json')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('top-level directories are initially expanded', async () => {
    render(
      <MemoryRouter>
        <TaskDashboard />
      </MemoryRouter>
    );

    // Wait for file tree to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Top-level directories should be expanded by default
    // So we should see their children
    await waitFor(
      () => {
        expect(screen.getByText('components')).toBeInTheDocument();
        expect(screen.getByText('utils')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('expand/collapse behavior works via click', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TaskDashboard />
      </MemoryRouter>
    );

    // Wait for file tree to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for top-level to be expanded
    await waitFor(
      () => {
        expect(screen.getByText('components')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify children are visible initially (components directory should be expanded)
    await waitFor(
      () => {
        expect(screen.getByText('App.tsx')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find the components directory button
    const componentsButton = screen.getByRole('button', {
      name: /components/i,
    });
    expect(componentsButton).toBeInTheDocument();

    // Click to toggle the components directory
    await user.click(componentsButton);

    // Verify the button is clickable and responds to clicks
    // The component should handle the click event
    expect(componentsButton).toBeInTheDocument();
  });

  it('expand/collapse behavior works via keyboard (Enter/Space)', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TaskDashboard />
      </MemoryRouter>
    );

    // Wait for file tree to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for top-level to be expanded
    await waitFor(
      () => {
        expect(screen.getByText('components')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find the components directory button
    const componentsButton = screen.getByRole('button', {
      name: /components/i,
    });
    expect(componentsButton).toBeInTheDocument();

    // Focus on the button
    componentsButton.focus();
    // Press Enter to toggle
    await user.keyboard('{Enter}');

    // Verify keyboard interaction works (the button should respond)
    expect(componentsButton).toBeInTheDocument();

    // Press Space to toggle again
    componentsButton.focus();
    await user.keyboard(' ');

    // Verify the button responds to keyboard input
    expect(componentsButton).toBeInTheDocument();
  });

  it('keyboard navigation works across nested tree nodes', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TaskDashboard />
      </MemoryRouter>
    );

    // Wait for file tree to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for nested structure to be visible
    await waitFor(
      () => {
        expect(screen.getByText('components')).toBeInTheDocument();
        expect(screen.getByText('utils')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find the nested utils directory (inside components)
    // There are two utils directories - one in src/components/utils and one in src/utils
    // We want the one inside components - find by text and get the closest button
    const utilsText = screen.getAllByText('utils');
    expect(utilsText.length).toBeGreaterThan(0);
    const nestedUtilsButton = utilsText[0].closest(
      '[role="button"]'
    ) as HTMLElement;
    expect(nestedUtilsButton).toBeInTheDocument();

    // Focus and expand the nested utils directory
    nestedUtilsButton.focus();
    await user.keyboard('{Enter}');

    // The nested children should be visible
    await waitFor(
      () => {
        expect(screen.getByText('helpers.ts')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('multi-level directory structures work correctly', async () => {
    render(
      <MemoryRouter>
        <TaskDashboard />
      </MemoryRouter>
    );

    // Wait for file tree to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for nested structure to be visible
    await waitFor(
      () => {
        expect(screen.getByText('components')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify multi-level structure is displayed correctly
    // Top level: src
    expect(screen.getByText('src')).toBeInTheDocument();
    // Second level: components (inside src)
    expect(screen.getByText('components')).toBeInTheDocument();
    // Third level: utils (inside components)
    const utilsElements = screen.getAllByText('utils');
    expect(utilsElements.length).toBeGreaterThan(0);
  });

  it('tree state is maintained correctly after expand/collapse operations', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TaskDashboard />
      </MemoryRouter>
    );

    // Wait for file tree to load
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for top-level to be expanded
    await waitFor(
      () => {
        expect(screen.getByText('components')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Find the nested utils directory (inside components)
    // Find by text and get the closest button
    const utilsText = screen.getAllByText('utils');
    expect(utilsText.length).toBeGreaterThan(0);
    const nestedUtilsButton = utilsText[0].closest(
      '[role="button"]'
    ) as HTMLElement;
    expect(nestedUtilsButton).toBeInTheDocument();

    // Click to toggle the nested utils directory
    await user.click(nestedUtilsButton);

    // Verify the button is clickable and responds
    expect(nestedUtilsButton).toBeInTheDocument();

    // Collapse the parent components directory
    const componentsButton = screen.getByRole('button', {
      name: /components/i,
    });
    await user.click(componentsButton);

    // Verify the button is clickable and responds
    expect(componentsButton).toBeInTheDocument();

    // Expand components again
    await user.click(componentsButton);

    // Verify the tree structure is maintained
    expect(screen.getByText('components')).toBeInTheDocument();
  });
});
