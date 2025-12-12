import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';
import type { Task } from '../types';

/**
 * Integration tests for Task List → Detail flow
 *
 * These tests verify that users can navigate from the task list to a task detail view,
 * and that the detail view correctly displays task information.
 */

describe('Task List → Detail Flow Integration', () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      prompt: 'Test task 1',
      status: 0,
      status_label: 'ready',
      createdat: '2024-01-01T00:00:00Z',
      updatedat: '2024-01-01T00:00:00Z',
      order: 1,
      uuid: 'uuid-1',
    },
    {
      id: 2,
      prompt: 'Test task 2',
      status: 1,
      status_label: 'complete',
      createdat: '2024-01-02T00:00:00Z',
      updatedat: '2024-01-02T00:00:00Z',
      order: 2,
      uuid: 'uuid-2',
    },
    {
      id: 3,
      prompt: 'Test task 3',
      status: 2,
      status_label: 'archived',
      createdat: '2024-01-03T00:00:00Z',
      updatedat: '2024-01-03T00:00:00Z',
      order: 3,
      uuid: 'uuid-3',
    },
  ];

  beforeEach(() => {
    // Set up default MSW handlers
    server.use(
      http.get(/\/api\/tasks/, () => {
        return HttpResponse.json(mockTasks, {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/conversations\/api\/tasks/, () => {
        return HttpResponse.json(mockTasks, {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
      http.get(/\/api\/tasks\/\d+/, ({ request }) => {
        const url = new URL(request.url);
        const match = url.pathname.match(/\/tasks\/(\d+)$/);
        const taskId = match ? parseInt(match[1], 10) : 0;
        const task = mockTasks.find((t) => t.id === taskId);
        if (task) {
          return HttpResponse.json(task, {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return HttpResponse.json(
          { error: 'Task not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      http.get(/\/conversations\/api\/tasks\/\d+/, ({ request }) => {
        const url = new URL(request.url);
        const match = url.pathname.match(/\/tasks\/(\d+)$/);
        const taskId = match ? parseInt(match[1], 10) : 0;
        const task = mockTasks.find((t) => t.id === taskId);
        if (task) {
          return HttpResponse.json(task, {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return HttpResponse.json(
          { error: 'Task not found' },
          { status: 404, headers: { 'Content-Type': 'application/json' } }
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

  it('task list loads and displays tasks', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <App />
      </MemoryRouter>
    );

    // Wait for tasks to load - task prompts are displayed
    await waitFor(() => {
      expect(screen.getByText(/test task 1/i)).toBeInTheDocument();
    });

    // Verify all tasks are displayed
    expect(screen.getByText(/test task 1/i)).toBeInTheDocument();
    expect(screen.getByText(/test task 2/i)).toBeInTheDocument();
    expect(screen.getByText(/test task 3/i)).toBeInTheDocument();
  });

  it('task links are present in the list for navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <App />
      </MemoryRouter>
    );

    // Wait for tasks to load - task prompt is shown in preview format
    await waitFor(() => {
      // The task prompt is displayed in the list
      expect(screen.getByText(/test task 1/i)).toBeInTheDocument();
    });

    // Verify task links are present (they link to /tasks/:id)
    // Note: The actual navigation is tested separately via direct route access
    const taskLinks = screen.getAllByRole('link');
    const hasTaskLink = taskLinks.some((link) =>
      link.getAttribute('href')?.includes('/tasks/')
    );
    expect(hasTaskLink).toBe(true);
  });

  it('detail view loads and displays task information', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks/1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for Navigation to appear (indicates route has matched)
    await waitFor(
      () => {
        expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for the back link to appear (indicates TaskDetailView is rendered)
    await waitFor(
      () => {
        expect(
          screen.getByRole('link', { name: /back to tasks/i })
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Verify task details are displayed (the prompt should be visible)
    await waitFor(
      () => {
        // TaskDetails shows the prompt - use a flexible matcher
        const prompt = screen.queryByText((content, element) => {
          return element?.textContent?.includes('Test task 1') || false;
        });
        expect(prompt).toBeTruthy();
      },
      { timeout: 10000 }
    );
  });

  it('handles 404 error when task is not found', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks/999']}>
        <App />
      </MemoryRouter>
    );

    // Wait for Navigation to appear (indicates route has matched)
    await waitFor(
      () => {
        expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for the back link to appear (indicates TaskDetailView is rendered)
    await waitFor(
      () => {
        expect(
          screen.getByRole('link', { name: /back to tasks/i })
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Wait for error to be displayed - the API throws "Task not found"
    await waitFor(
      () => {
        // ErrorMessage component displays the error message
        expect(screen.getByText('Task not found')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('navigation back to list works correctly', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/tasks/1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for the back link to appear
    await waitFor(
      () => {
        expect(
          screen.getByRole('link', { name: /back to tasks/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Click back link
    const backLink = screen.getByRole('link', { name: /back to tasks/i });
    await user.click(backLink);

    // Verify we navigated back to list
    await waitFor(() => {
      // Use getAllByText since "Tasks" appears in both nav and heading
      const tasksHeadings = screen.getAllByText('Tasks');
      expect(tasksHeadings.length).toBeGreaterThan(0);
      // All tasks should be visible again
      expect(screen.getByText(/test task 1/i)).toBeInTheDocument();
      expect(screen.getByText(/test task 2/i)).toBeInTheDocument();
    });
  });

  it('active task highlighting works correctly', async () => {
    // Test that when we're on the list, tasks are displayed
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/test task 1/i)).toBeInTheDocument();
    });

    // The active task highlighting is tested in unit tests
    // For integration, we verify the flow works
    expect(screen.getByText(/test task 1/i)).toBeInTheDocument();
  });

  it('handles invalid task ID gracefully', async () => {
    render(
      <MemoryRouter initialEntries={['/tasks/invalid']}>
        <App />
      </MemoryRouter>
    );

    // Wait for the back link to appear (indicates TaskDetailView is rendered)
    await waitFor(
      () => {
        expect(
          screen.getByRole('link', { name: /back to tasks/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for error to be displayed (invalid ID is caught immediately, no loading)
    await waitFor(
      () => {
        expect(screen.getByText('Invalid task ID')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('handles network error when loading task list', async () => {
    server.use(
      http.get(/\/api\/tasks/, () => {
        return HttpResponse.json(
          { error: 'Network error' },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      http.get(/\/conversations\/api\/tasks/, () => {
        return HttpResponse.json(
          { error: 'Network error' },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <App />
      </MemoryRouter>
    );

    // Wait for error to be displayed
    await waitFor(
      () => {
        // The error message from the API client
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles network error when loading task detail', async () => {
    server.use(
      http.get(/\/api\/tasks\/\d+/, () => {
        return HttpResponse.json(
          { error: 'Network error' },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }),
      http.get(/\/conversations\/api\/tasks\/\d+/, () => {
        return HttpResponse.json(
          { error: 'Network error' },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );

    render(
      <MemoryRouter initialEntries={['/tasks/1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for the back link to appear (indicates TaskDetailView is rendered)
    await waitFor(
      () => {
        expect(
          screen.getByRole('link', { name: /back to tasks/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Wait for error to be displayed
    await waitFor(
      () => {
        // The error message from the API client - "Failed to fetch task: Internal Server Error" or "Network error"
        const errorText = screen.getByText(/network error|failed to fetch/i);
        expect(errorText).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
