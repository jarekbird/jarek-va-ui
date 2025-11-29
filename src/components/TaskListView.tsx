import React from 'react';
import { useLocation } from 'react-router-dom';
import { TaskList } from './TaskList';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Navigation } from './Navigation';
import { listTasks } from '../api/tasks';
import type { Task } from '../types';

export const TaskListView: React.FC = () => {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listTasks();
      setTasks(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while loading tasks'
      );
    } finally {
      setLoading(false);
    }
  };

  // Extract task ID from URL if present (for highlighting active task)
  const activeTaskId = location.pathname.startsWith('/task/')
    ? parseInt(location.pathname.split('/task/')[1], 10)
    : null;

  const handleSelectTask = (taskId: number) => {
    // Navigation is handled by Link component in TaskList
    // This handler is kept for compatibility but Link handles the actual navigation
    // The taskId parameter is required by the TaskList interface
    void taskId; // Explicitly mark as used to satisfy linter
  };

  return (
    <div className="container">
      <Navigation />
      <h1>Tasks</h1>
      {loading && tasks.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && tasks.length > 0 && (
        <TaskList
          tasks={tasks}
          activeTaskId={activeTaskId}
          onSelectTask={handleSelectTask}
        />
      )}
      {!loading && !error && tasks.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>No tasks found.</p>
      )}
    </div>
  );
};


