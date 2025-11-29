import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { TaskDetails } from './TaskDetails';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { getTaskById } from '../api/tasks';
import type { Task } from '../types';

export const TaskDetailView: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [task, setTask] = React.useState<Task | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (taskId) {
      const id = parseInt(taskId, 10);
      if (!isNaN(id)) {
        loadTask(id);
      } else {
        setError('Invalid task ID');
        setLoading(false);
      }
    }
  }, [taskId]);

  const loadTask = async (taskId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTaskById(taskId);
      setTask(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while loading the task'
      );
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tasks" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← Back to Tasks
        </Link>
      </div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && task && <TaskDetails task={task} />}
      {!loading && !error && !task && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Task not found.</p>
      )}
    </div>
  );
};
