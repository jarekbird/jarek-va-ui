import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { RelatedTasksPanel } from '../RelatedTasksPanel';
import type { Task } from '../../types';

describe('RelatedTasksPanel', () => {
  const mockTasks: Task[] = [
    {
      id: 1,
      prompt: 'Test task 1',
      status: 1,
      status_label: 'ready',
      createdat: '2025-01-01T12:00:00Z',
      updatedat: '2025-01-01T13:00:00Z',
      order: 0,
      uuid: null,
    },
    {
      id: 2,
      prompt: 'Test task 2',
      status: 2,
      status_label: 'complete',
      createdat: '2025-01-01T12:00:00Z',
      updatedat: '2025-01-01T13:00:00Z',
      order: 1,
      uuid: null,
    },
  ];

  it('renders empty state when no tasks', () => {
    render(<RelatedTasksPanel tasks={[]} conversationId="conv-123" />);

    expect(screen.getByText('Related Tasks')).toBeInTheDocument();
    expect(screen.getByText('No related tasks found.')).toBeInTheDocument();
  });

  it('renders list of tasks', () => {
    render(<RelatedTasksPanel tasks={mockTasks} conversationId="conv-123" />);

    expect(screen.getByText('Related Tasks')).toBeInTheDocument();
    expect(screen.getByText('Test task 1')).toBeInTheDocument();
    expect(screen.getByText('Test task 2')).toBeInTheDocument();
  });

  it('renders task links with correct hrefs', () => {
    render(<RelatedTasksPanel tasks={mockTasks} conversationId="conv-123" />);

    const link1 = screen.getByTestId('related-task-1');
    const link2 = screen.getByTestId('related-task-2');

    expect(link1).toHaveAttribute('href', '/tasks/1');
    expect(link2).toHaveAttribute('href', '/tasks/2');
  });

  it('renders task IDs correctly', () => {
    render(<RelatedTasksPanel tasks={mockTasks} conversationId="conv-123" />);

    expect(screen.getByText('Task #1')).toBeInTheDocument();
    expect(screen.getByText('Task #2')).toBeInTheDocument();
  });

  it('renders task status labels correctly', () => {
    render(<RelatedTasksPanel tasks={mockTasks} conversationId="conv-123" />);

    const readyStatus = screen.getByText('ready');
    const completeStatus = screen.getByText('complete');

    expect(readyStatus).toBeInTheDocument();
    expect(completeStatus).toBeInTheDocument();
    expect(readyStatus).toHaveClass('related-tasks-panel__status--ready');
    expect(completeStatus).toHaveClass('related-tasks-panel__status--complete');
  });

  it('renders task prompts', () => {
    render(<RelatedTasksPanel tasks={mockTasks} conversationId="conv-123" />);

    expect(screen.getByText('Test task 1')).toBeInTheDocument();
    expect(screen.getByText('Test task 2')).toBeInTheDocument();
  });
});
