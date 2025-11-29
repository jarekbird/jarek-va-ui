/**
 * TaskManagementPanel Component
 * Displays task list and allows adding new tasks
 */

import React, { useState, useEffect } from 'react';
import { listTasks, createTask, type Task } from '../api/tasks';
import { TaskList } from './TaskList';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import './TaskManagementPanel.css';

export const TaskManagementPanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTaskPrompt, setNewTaskPrompt] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listTasks();
      setTasks(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading tasks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskPrompt.trim()) {
      setCreateError('Task prompt cannot be empty');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      const newTask = await createTask(newTaskPrompt.trim());
      setTasks([...tasks, newTask]);
      setNewTaskPrompt('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setCreateError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

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

      <div className="task-management-panel__add-task">
        <form onSubmit={handleCreateTask}>
          <div className="task-management-panel__input-group">
            <input
              type="text"
              value={newTaskPrompt}
              onChange={(e) => {
                setNewTaskPrompt(e.target.value);
                setCreateError(null);
              }}
              placeholder="Enter task prompt..."
              className="task-management-panel__input"
              disabled={isCreating}
            />
            <button
              type="submit"
              className="task-management-panel__add-button"
              disabled={isCreating || !newTaskPrompt.trim()}
            >
              {isCreating ? 'Adding...' : 'Add Task'}
            </button>
          </div>
          {createError && <ErrorMessage message={createError} />}
        </form>
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
          <p className="task-management-panel__empty">No tasks found.</p>
        )}
      </div>
    </div>
  );
};

