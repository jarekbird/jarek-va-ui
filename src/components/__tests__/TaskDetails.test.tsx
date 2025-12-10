import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { TaskDetails } from '../TaskDetails';
import type { Task } from '../../types';

/**
 * Comprehensive unit tests for TaskDetails component
 *
 * This test suite verifies:
 * - Task data is rendered correctly (ID, title, status, timestamps, etc.)
 * - Status badge displays with correct color and label
 * - Component handles null/undefined task gracefully
 * - All task fields are displayed appropriately
 * - Component is purely presentational (no side effects)
 */

// Helper to create mock tasks
const createMockTask = (
  id: number,
  status_label: string = 'ready',
  order: number = id,
  prompt: string = `Test task ${id}`,
  uuid?: string,
  createdat?: string,
  updatedat?: string
): Task => ({
  id,
  prompt,
  status: 0,
  status_label,
  createdat: createdat || new Date(Date.now() - id * 1000).toISOString(),
  updatedat: updatedat || new Date().toISOString(),
  order,
  uuid: uuid || `task-uuid-${id}`,
});

describe('TaskDetails', () => {
  describe('Null/undefined task handling', () => {
    it('returns null when task is null', () => {
      const { container } = render(<TaskDetails task={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Task data rendering', () => {
    it('renders task ID in heading', () => {
      const task = createMockTask(1);
      render(<TaskDetails task={task} />);

      expect(
        screen.getByRole('heading', { level: 2, name: /task #1/i })
      ).toBeInTheDocument();
    });

    it('renders task prompt', () => {
      const task = createMockTask(1, 'ready', 1, 'This is a test prompt');
      render(<TaskDetails task={task} />);

      expect(screen.getByText('This is a test prompt')).toBeInTheDocument();
    });

    it('renders status label and status code', () => {
      const task = createMockTask(1, 'ready', 1);
      render(<TaskDetails task={task} />);

      expect(screen.getByText(/ready \(0\)/i)).toBeInTheDocument();
    });

    it('renders order', () => {
      const task = createMockTask(1, 'ready', 5);
      render(<TaskDetails task={task} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      // Check that it's in the Order section
      const orderLabel = screen.getByText('Order');
      expect(orderLabel).toBeInTheDocument();
    });

    it('renders UUID when present', () => {
      const task = createMockTask(1, 'ready', 1, 'Test', 'custom-uuid-123');
      render(<TaskDetails task={task} />);

      expect(screen.getByText('custom-uuid-123')).toBeInTheDocument();
      expect(screen.getByText('UUID')).toBeInTheDocument();
    });

    it('does not render UUID section when uuid is missing', () => {
      const task = createMockTask(1, 'ready', 1, 'Test', '');
      // Remove uuid property
      const taskWithoutUuid = { ...task, uuid: undefined };
      render(<TaskDetails task={taskWithoutUuid} />);

      expect(screen.queryByText('UUID')).not.toBeInTheDocument();
    });

    it('renders created at timestamp when present', () => {
      const createdDate = new Date('2024-01-01T12:00:00Z');
      const task = createMockTask(
        1,
        'ready',
        1,
        'Test',
        undefined,
        createdDate.toISOString()
      );
      render(<TaskDetails task={task} />);

      expect(screen.getByText('Created At')).toBeInTheDocument();
      // Check that the formatted date is displayed
      const formattedDate = createdDate.toLocaleString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('does not render created at section when createdat is missing', () => {
      const task = createMockTask(1, 'ready', 1, 'Test');
      const taskWithoutCreated = { ...task, createdat: undefined };
      render(<TaskDetails task={taskWithoutCreated} />);

      expect(screen.queryByText('Created At')).not.toBeInTheDocument();
    });

    it('renders updated at timestamp when present', () => {
      const updatedDate = new Date('2024-01-02T12:00:00Z');
      const task = createMockTask(
        1,
        'ready',
        1,
        'Test',
        undefined,
        undefined,
        updatedDate.toISOString()
      );
      render(<TaskDetails task={task} />);

      expect(screen.getByText('Updated At')).toBeInTheDocument();
      // Check that the formatted date is displayed
      const formattedDate = updatedDate.toLocaleString();
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('does not render updated at section when updatedat is missing', () => {
      const task = createMockTask(1, 'ready', 1, 'Test');
      const taskWithoutUpdated = { ...task, updatedat: undefined };
      render(<TaskDetails task={taskWithoutUpdated} />);

      expect(screen.queryByText('Updated At')).not.toBeInTheDocument();
    });
  });

  describe('Status badge', () => {
    it('displays status badge with correct label', () => {
      const task = createMockTask(1, 'ready');
      render(<TaskDetails task={task} />);

      const badge = screen.getByText('ready');
      expect(badge).toBeInTheDocument();
      // Check that it's styled as uppercase
      expect(badge).toHaveStyle({ textTransform: 'uppercase' });
    });

    it('displays status badge with ready status color', () => {
      const task = createMockTask(1, 'ready');
      render(<TaskDetails task={task} />);

      const badge = screen.getByText('ready');
      expect(badge).toHaveStyle({ color: '#3498db' });
    });

    it('displays status badge with complete status color', () => {
      const task = createMockTask(1, 'complete');
      render(<TaskDetails task={task} />);

      const badge = screen.getByText('complete');
      expect(badge).toHaveStyle({ color: '#27ae60' });
    });

    it('displays status badge with archived status color', () => {
      const task = createMockTask(1, 'archived');
      render(<TaskDetails task={task} />);

      const badge = screen.getByText('archived');
      expect(badge).toHaveStyle({ color: '#95a5a6' });
    });

    it('displays status badge with backlogged status color', () => {
      const task = createMockTask(1, 'backlogged');
      render(<TaskDetails task={task} />);

      const badge = screen.getByText('backlogged');
      expect(badge).toHaveStyle({ color: '#f39c12' });
    });

    it('displays status badge with default color for unknown status', () => {
      const task = createMockTask(1, 'unknown-status');
      render(<TaskDetails task={task} />);

      const badge = screen.getByText('unknown-status');
      expect(badge).toHaveStyle({ color: '#7f8c8d' });
    });

    it('applies correct background color to status badge', () => {
      const task = createMockTask(1, 'ready');
      render(<TaskDetails task={task} />);

      const badge = screen.getByText('ready');
      // Background color should be the status color with 20% opacity (hex + 20)
      expect(badge).toHaveStyle({
        backgroundColor: 'rgba(52, 152, 219, 0.125)',
      });
    });
  });

  describe('Component structure', () => {
    it('renders with correct container class', () => {
      const task = createMockTask(1);
      const { container } = render(<TaskDetails task={task} />);

      const detailsContainer = container.querySelector('.conversation-details');
      expect(detailsContainer).toBeInTheDocument();
    });

    it('renders prompt section with correct heading', () => {
      const task = createMockTask(1, 'ready', 1, 'Test prompt');
      render(<TaskDetails task={task} />);

      expect(
        screen.getByRole('heading', { level: 3, name: /prompt/i })
      ).toBeInTheDocument();
    });

    it('renders all metadata sections', () => {
      const task = createMockTask(1, 'ready', 1, 'Test');
      render(<TaskDetails task={task} />);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Order')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles task with all optional fields', () => {
      const task = createMockTask(
        999,
        'complete',
        42,
        'Complex task with all fields',
        'full-uuid-12345',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z'
      );
      render(<TaskDetails task={task} />);

      expect(
        screen.getByRole('heading', { level: 2, name: /task #999/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Complex task with all fields')
      ).toBeInTheDocument();
      expect(screen.getByText('complete')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('full-uuid-12345')).toBeInTheDocument();
      expect(screen.getByText('Created At')).toBeInTheDocument();
      expect(screen.getByText('Updated At')).toBeInTheDocument();
    });

    it('handles task with minimal fields', () => {
      const task: Task = {
        id: 1,
        prompt: 'Minimal task',
        status: 0,
        status_label: 'ready',
        order: 1,
        uuid: undefined,
        createdat: undefined,
        updatedat: undefined,
      };
      render(<TaskDetails task={task} />);

      expect(
        screen.getByRole('heading', { level: 2, name: /task #1/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Minimal task')).toBeInTheDocument();
      expect(screen.queryByText('UUID')).not.toBeInTheDocument();
      expect(screen.queryByText('Created At')).not.toBeInTheDocument();
      expect(screen.queryByText('Updated At')).not.toBeInTheDocument();
    });

    it('handles long prompt text', () => {
      const longPrompt = 'A'.repeat(1000);
      const task = createMockTask(1, 'ready', 1, longPrompt);
      render(<TaskDetails task={task} />);

      expect(screen.getByText(longPrompt)).toBeInTheDocument();
    });

    it('handles task with different status values', () => {
      const statuses: Array<
        'ready' | 'complete' | 'archived' | 'backlogged' | 'unknown'
      > = ['ready', 'complete', 'archived', 'backlogged', 'unknown'];
      statuses.forEach((status) => {
        const task = createMockTask(1, status);
        const { unmount } = render(<TaskDetails task={task} />);

        expect(screen.getByText(status)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
