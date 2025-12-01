/**
 * TaskManagementPanel Component
 * Read-only display of tasks from the database
 * Tasks are created by cursor-cli, not manually in the UI
 */

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { listTasks } from '../api/tasks';
import type { Task } from '../types';
import { TaskList } from './TaskList';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import './TaskManagementPanel.css';

export interface TaskManagementPanelRef {
  refresh: () => Promise<void>;
}

export const TaskManagementPanel = forwardRef<TaskManagementPanelRef>(
  (_props, ref) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      loadTasks();
    }, []);

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[TaskManagementPanel] Loading tasks from /api/tasks...');
        const data = await listTasks();
        console.log('[TaskManagementPanel] Tasks loaded successfully:', {
          count: data.length,
          tasks: data,
        });
        setTasks(Array.isArray(data) ? data : []);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'An error occurred while loading tasks';
        console.error('[TaskManagementPanel] Error loading tasks:', {
          error: err,
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(errorMessage);
        setTasks([]); // Clear tasks on error
      } finally {
        setLoading(false);
      }
    };

    // Expose refresh method via ref
    useImperativeHandle(ref, () => ({
      refresh: async () => {
        await loadTasks();
      },
    }));

    const handleSelectTask = (taskId: number) => {
      // Navigation is handled by Link component in TaskList
      void taskId; // Explicitly mark as used to satisfy linter
    };

    return (
      <div className="task-management-panel">
        <div className="task-management-panel__header">
          <h3>Tasks</h3>
          <button
            className="task-management-panel__refresh"
            onClick={loadTasks}
            title="Refresh"
            aria-label="Refresh tasks"
          >
            ↻
          </button>
        </div>

        <div className="task-management-panel__list">
          {loading && tasks.length === 0 && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && tasks.length > 0 && (
            <TaskList
              tasks={tasks}
              activeTaskId={null}
              onSelectTask={handleSelectTask}
            />
          )}
          {!loading && !error && tasks.length === 0 && (
            <p className="task-management-panel__empty">
              No tasks found. Tasks are created by cursor-cli.
            </p>
          )}
        </div>
      </div>
    );
  }
);

TaskManagementPanel.displayName = 'TaskManagementPanel';
