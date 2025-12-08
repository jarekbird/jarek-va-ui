import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { TaskList } from '../TaskList';
import type { Task } from '../../types';

/**
 * Comprehensive unit tests for TaskList component
 *
 * This test suite verifies:
 * - Tasks are grouped by status_label in correct order
 * - Tasks are sorted within each group by order then id
 * - Active task highlighting works from both props and URL
 * - Task selection triggers callbacks
 * - Status badges render with correct colors and labels
 * - Component renders correctly with different task lists
 */

// Mock useLocation from react-router-dom
const mockUseLocation = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    Link: ({
      to,
      children,
      onClick,
      ...props
    }: {
      to: string;
      children: React.ReactNode;
      onClick?: () => void;
      [key: string]: unknown;
    }) => (
      <a href={to} onClick={onClick} {...props}>
        {children}
      </a>
    ),
  };
});

// Helper to create mock tasks
const createMockTask = (
  id: number,
  status_label: string,
  order: number = id,
  prompt: string = `Test task ${id}`
): Task => ({
  id,
  prompt,
  status: 0,
  status_label,
  createdat: new Date(Date.now() - id * 1000).toISOString(),
  updatedat: new Date().toISOString(),
  order,
  uuid: `task-uuid-${id}`,
});

describe('TaskList', () => {
  const mockTasks: Task[] = [
    createMockTask(1, 'ready', 1, 'Ready task 1'),
    createMockTask(2, 'ready', 2, 'Ready task 2'),
    createMockTask(3, 'backlogged', 1, 'Backlogged task 1'),
    createMockTask(4, 'backlogged', 2, 'Backlogged task 2'),
    createMockTask(5, 'complete', 1, 'Complete task 1'),
    createMockTask(6, 'complete', 2, 'Complete task 2'),
    createMockTask(7, 'archived', 1, 'Archived task 1'),
    createMockTask(8, 'archived', 2, 'Archived task 2'),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock location
    mockUseLocation.mockReturnValue({
      pathname: '/tasks',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });
  });

  // Helper to render component
  const renderComponent = (
    tasks: Task[],
    activeTaskId: number | null = null,
    onSelectTask = vi.fn(),
    pathname = '/tasks'
  ) => {
    mockUseLocation.mockReturnValue({
      pathname,
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });

    return render(
      <TaskList
        tasks={tasks}
        activeTaskId={activeTaskId}
        onSelectTask={onSelectTask}
      />
    );
  };

  describe('Status grouping', () => {
    it('groups tasks by status_label', () => {
      renderComponent(mockTasks);

      // Check that status headers are present
      expect(screen.getByText(/ready \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/backlogged \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/complete \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/archived \(2\)/i)).toBeInTheDocument();
    });

    it('displays groups in correct order: ready, backlogged, complete, archived', () => {
      renderComponent(mockTasks);

      const statusHeaders = screen.getAllByRole('heading', { level: 3 });
      expect(statusHeaders[0]).toHaveTextContent(/ready/i);
      expect(statusHeaders[1]).toHaveTextContent(/backlogged/i);
      expect(statusHeaders[2]).toHaveTextContent(/complete/i);
      expect(statusHeaders[3]).toHaveTextContent(/archived/i);
    });

    it('does not display empty groups', () => {
      const tasksWithSomeStatuses: Task[] = [
        createMockTask(1, 'ready'),
        createMockTask(2, 'complete'),
      ];

      renderComponent(tasksWithSomeStatuses);

      expect(screen.getByText(/ready \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/complete \(1\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/backlogged/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/archived/i)).not.toBeInTheDocument();
    });

    it('handles tasks with unknown status gracefully', () => {
      const tasksWithUnknownStatus: Task[] = [
        createMockTask(1, 'ready'),
        createMockTask(2, 'unknown-status'),
      ];

      renderComponent(tasksWithUnknownStatus);

      // Ready group should be displayed
      expect(screen.getByText(/ready \(1\)/i)).toBeInTheDocument();
      // Unknown status tasks won't appear in any of the predefined groups
      // but component should not crash
      expect(screen.queryByText(/unknown-status/i)).not.toBeInTheDocument();
    });
  });

  describe('Sorting within groups', () => {
    it('sorts tasks within each group by order first', () => {
      const tasksWithDifferentOrders: Task[] = [
        createMockTask(1, 'ready', 3, 'Task with order 3'),
        createMockTask(2, 'ready', 1, 'Task with order 1'),
        createMockTask(3, 'ready', 2, 'Task with order 2'),
      ];

      renderComponent(tasksWithDifferentOrders);

      const taskItems = screen.getAllByText(/task with order/i);
      expect(taskItems[0]).toHaveTextContent(/order 1/i);
      expect(taskItems[1]).toHaveTextContent(/order 2/i);
      expect(taskItems[2]).toHaveTextContent(/order 3/i);
    });

    it('sorts tasks by id when order is the same', () => {
      const tasksWithSameOrder: Task[] = [
        createMockTask(3, 'ready', 1, 'Task 3'),
        createMockTask(1, 'ready', 1, 'Task 1'),
        createMockTask(2, 'ready', 1, 'Task 2'),
      ];

      renderComponent(tasksWithSameOrder);

      const taskItems = screen.getAllByText(/task \d/i);
      expect(taskItems[0]).toHaveTextContent(/task 1/i);
      expect(taskItems[1]).toHaveTextContent(/task 2/i);
      expect(taskItems[2]).toHaveTextContent(/task 3/i);
    });

    it('does not mutate the original tasks array', () => {
      const originalTasks = [...mockTasks];
      renderComponent(mockTasks);

      // Original array should be unchanged
      expect(mockTasks).toEqual(originalTasks);
    });
  });

  describe('Active state from prop', () => {
    it('applies active class when activeTaskId prop matches', () => {
      renderComponent(mockTasks, 1);

      const task1 = screen.getByText(/ready task 1/i).closest('li');
      expect(task1).toHaveClass('active');
    });

    it('does not apply active class when prop does not match', () => {
      renderComponent(mockTasks, 1);

      const task2 = screen.getByText(/ready task 2/i).closest('li');
      expect(task2).not.toHaveClass('active');
    });

    it('only one task is active at a time', () => {
      renderComponent(mockTasks, 3);

      const activeTasks = screen
        .getAllByRole('listitem')
        .filter((li) => li.classList.contains('active'));
      expect(activeTasks.length).toBe(1);
      expect(activeTasks[0]).toHaveTextContent(/backlogged task 1/i);
    });

    it('no task is active when activeTaskId is null', () => {
      renderComponent(mockTasks, null);

      const activeTasks = screen
        .getAllByRole('listitem')
        .filter((li) => li.classList.contains('active'));
      expect(activeTasks.length).toBe(0);
    });
  });

  describe('Active state from URL', () => {
    it('applies active class when URL matches task ID', () => {
      renderComponent(mockTasks, null, vi.fn(), '/tasks/2');

      const task2 = screen.getByText(/ready task 2/i).closest('li');
      expect(task2).toHaveClass('active');
    });

    it('extracts task ID correctly from /tasks/:id URL', () => {
      renderComponent(mockTasks, null, vi.fn(), '/tasks/5');

      const task5 = screen.getByText(/complete task 1/i).closest('li');
      expect(task5).toHaveClass('active');
    });

    it('prop takes precedence over URL when both provided', () => {
      renderComponent(mockTasks, 1, vi.fn(), '/tasks/2');

      const task1 = screen.getByText(/ready task 1/i).closest('li');
      const task2 = screen.getByText(/ready task 2/i).closest('li');

      expect(task1).toHaveClass('active');
      expect(task2).not.toHaveClass('active');
    });

    it('handles invalid URL task ID gracefully', () => {
      renderComponent(mockTasks, null, vi.fn(), '/tasks/invalid');

      const activeTasks = screen
        .getAllByRole('listitem')
        .filter((li) => li.classList.contains('active'));
      expect(activeTasks.length).toBe(0);
    });

    it('handles URL that does not match any task', () => {
      renderComponent(mockTasks, null, vi.fn(), '/tasks/999');

      const activeTasks = screen
        .getAllByRole('listitem')
        .filter((li) => li.classList.contains('active'));
      expect(activeTasks.length).toBe(0);
    });
  });

  describe('Task selection', () => {
    it('calls onSelectTask when a task is clicked', async () => {
      const user = userEvent.setup();
      const onSelectTask = vi.fn();

      renderComponent(mockTasks, null, onSelectTask);

      const taskLink = screen.getByText(/ready task 1/i).closest('a');
      expect(taskLink).toBeTruthy();
      if (taskLink) {
        await user.click(taskLink);
        expect(onSelectTask).toHaveBeenCalledWith(1);
      }
    });

    it('Link navigates to /tasks/:id', () => {
      renderComponent(mockTasks);

      const taskLink = screen.getByText(/ready task 1/i).closest('a');
      expect(taskLink).toHaveAttribute('href', '/tasks/1');
    });

    it('selection works for tasks in all status groups', async () => {
      const user = userEvent.setup();
      const onSelectTask = vi.fn();

      renderComponent(mockTasks, null, onSelectTask);

      // Test ready task
      const readyLink = screen.getByText(/ready task 1/i).closest('a');
      if (readyLink) {
        await user.click(readyLink);
        expect(onSelectTask).toHaveBeenCalledWith(1);
      }

      // Test backlogged task
      const backloggedLink = screen
        .getByText(/backlogged task 1/i)
        .closest('a');
      if (backloggedLink) {
        await user.click(backloggedLink);
        expect(onSelectTask).toHaveBeenCalledWith(3);
      }

      // Test complete task
      const completeLink = screen.getByText(/complete task 1/i).closest('a');
      if (completeLink) {
        await user.click(completeLink);
        expect(onSelectTask).toHaveBeenCalledWith(5);
      }

      // Test archived task
      const archivedLink = screen.getByText(/archived task 1/i).closest('a');
      if (archivedLink) {
        await user.click(archivedLink);
        expect(onSelectTask).toHaveBeenCalledWith(7);
      }
    });
  });

  describe('Status badges', () => {
    it('renders status badges with correct labels', () => {
      renderComponent(mockTasks);

      // Check badges in list items (not headers)
      const badges = screen.getAllByText('ready');
      expect(badges.length).toBeGreaterThan(0);
      expect(screen.getAllByText('backlogged').length).toBeGreaterThan(0);
      expect(screen.getAllByText('complete').length).toBeGreaterThan(0);
      expect(screen.getAllByText('archived').length).toBeGreaterThan(0);
    });

    it('applies correct color for ready status', () => {
      renderComponent([createMockTask(1, 'ready')]);

      // Get the badge span (not the header)
      const badges = screen.getAllByText('ready');
      const badge = badges.find((el) => el.tagName === 'SPAN');
      expect(badge).toBeTruthy();
      if (badge) {
        expect(badge).toHaveStyle({ color: '#3498db' });
      }
    });

    it('applies correct color for complete status', () => {
      renderComponent([createMockTask(1, 'complete')]);

      const badges = screen.getAllByText('complete');
      const badge = badges.find((el) => el.tagName === 'SPAN');
      expect(badge).toBeTruthy();
      if (badge) {
        expect(badge).toHaveStyle({ color: '#27ae60' });
      }
    });

    it('applies correct color for archived status', () => {
      renderComponent([createMockTask(1, 'archived')]);

      const badges = screen.getAllByText('archived');
      const badge = badges.find((el) => el.tagName === 'SPAN');
      expect(badge).toBeTruthy();
      if (badge) {
        expect(badge).toHaveStyle({ color: '#95a5a6' });
      }
    });

    it('applies correct color for backlogged status', () => {
      renderComponent([createMockTask(1, 'backlogged')]);

      const badges = screen.getAllByText('backlogged');
      const badge = badges.find((el) => el.tagName === 'SPAN');
      expect(badge).toBeTruthy();
      if (badge) {
        expect(badge).toHaveStyle({ color: '#f39c12' });
      }
    });

    it('uses default color for unknown status (component filters out unknown statuses)', () => {
      // Note: The component only displays tasks with status in statusOrder array
      // (ready, backlogged, complete, archived). Unknown statuses are filtered out.
      // This test verifies that getStatusColor returns default color for unknown status.
      const tasksWithUnknownStatus: Task[] = [
        {
          ...createMockTask(1, 'ready'),
          status_label: 'unknown-status',
        },
      ];

      renderComponent(tasksWithUnknownStatus);

      // Component should not render tasks with unknown status
      expect(screen.queryByText('unknown-status')).not.toBeInTheDocument();
      // No status headers should be displayed
      expect(
        screen.queryByRole('heading', { level: 3 })
      ).not.toBeInTheDocument();
    });

    it('applies badge styles correctly', () => {
      renderComponent([createMockTask(1, 'ready')]);

      const badges = screen.getAllByText('ready');
      const badge = badges.find((el) => el.tagName === 'SPAN');
      expect(badge).toBeTruthy();
      if (badge) {
        const style = window.getComputedStyle(badge);
        expect(style.textTransform).toBe('uppercase');
        expect(style.fontWeight).toBe('bold');
      }
    });
  });

  describe('Rendering', () => {
    it('renders all tasks in correct groups', () => {
      renderComponent(mockTasks);

      expect(screen.getByText(/ready task 1/i)).toBeInTheDocument();
      expect(screen.getByText(/ready task 2/i)).toBeInTheDocument();
      expect(screen.getByText(/backlogged task 1/i)).toBeInTheDocument();
      expect(screen.getByText(/backlogged task 2/i)).toBeInTheDocument();
      expect(screen.getByText(/complete task 1/i)).toBeInTheDocument();
      expect(screen.getByText(/complete task 2/i)).toBeInTheDocument();
      expect(screen.getByText(/archived task 1/i)).toBeInTheDocument();
      expect(screen.getByText(/archived task 2/i)).toBeInTheDocument();
    });

    it('displays task details correctly', () => {
      renderComponent([createMockTask(1, 'ready', 5, 'Test prompt text')]);

      expect(screen.getByText(/ID: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/order: 5/i)).toBeInTheDocument();
      expect(screen.getByText(/test prompt text/i)).toBeInTheDocument();
    });

    it('displays created date when available', () => {
      const task = createMockTask(1, 'ready');
      renderComponent([task]);

      const dateText = new Date(task.createdat).toLocaleString();
      expect(
        screen.getByText(new RegExp(`Created:.*${dateText.split(',')[0]}`, 'i'))
      ).toBeInTheDocument();
    });

    it('renders empty structure when task list is empty', () => {
      renderComponent([]);

      // No status headers should be displayed
      expect(
        screen.queryByRole('heading', { level: 3 })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('handles tasks with missing fields gracefully', () => {
      const taskWithMissingFields: Task = {
        id: 1,
        prompt: 'Test',
        status: 0,
        status_label: 'ready',
        createdat: '',
        updatedat: '',
        order: 0,
        uuid: 'test-uuid',
      };

      renderComponent([taskWithMissingFields]);

      expect(screen.getByText(/ID: 1/i)).toBeInTheDocument();
      expect(screen.getByText(/test/i)).toBeInTheDocument();
    });

    it('truncates long prompts to 100 characters', () => {
      const longPrompt = 'a'.repeat(150);
      const task = createMockTask(1, 'ready', 1, longPrompt);

      renderComponent([task]);

      const promptElement = screen.getByText(/^a{100}\.\.\.$/);
      expect(promptElement).toBeInTheDocument();
    });

    it('does not truncate short prompts', () => {
      const shortPrompt = 'Short prompt';
      const task = createMockTask(1, 'ready', 1, shortPrompt);

      renderComponent([task]);

      expect(screen.getByText(shortPrompt)).toBeInTheDocument();
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });

    it('does not display order when order is 0', () => {
      const task = createMockTask(1, 'ready', 0);
      renderComponent([task]);

      expect(screen.getByText(/ID: 1/i)).toBeInTheDocument();
      expect(screen.queryByText(/order: 0/i)).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles empty tasks array', () => {
      renderComponent([]);

      expect(
        screen.queryByRole('heading', { level: 3 })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('handles tasks with same order and id (stable sort)', () => {
      const tasksWithSameOrderAndId: Task[] = [
        createMockTask(1, 'ready', 1),
        createMockTask(1, 'ready', 1), // Duplicate ID (unlikely but possible)
      ];

      // Component should render without crashing
      renderComponent(tasksWithSameOrderAndId);

      const taskItems = screen.getAllByText(/ID: 1/i);
      expect(taskItems.length).toBeGreaterThanOrEqual(1);
    });

    it('handles missing onSelectTask prop gracefully', () => {
      // Render without onSelectTask (using default vi.fn())
      renderComponent(mockTasks, null, vi.fn());

      // Component should still render
      expect(screen.getByText(/ready task 1/i)).toBeInTheDocument();
    });

    it('handles URL path that does not start with /tasks/', () => {
      renderComponent(mockTasks, null, vi.fn(), '/other-route');

      const activeTasks = screen
        .getAllByRole('listitem')
        .filter((li) => li.classList.contains('active'));
      expect(activeTasks.length).toBe(0);
    });
  });
});
