import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { TaskDetails } from '../../components/TaskDetails';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useTaskQuery } from '../../hooks/useTaskQuery';

/**
 * Route component for displaying a single task detail view.
 * Reads taskId from route params and uses useTaskQuery to fetch data.
 */
export const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();

  // Parse taskId from string to number
  const parsedTaskId = taskId ? parseInt(taskId, 10) : 0;
  // Ensure parsedTaskId is a valid number (not NaN)
  const safeTaskId = isNaN(parsedTaskId) ? 0 : parsedTaskId;
  const isValidTaskId = safeTaskId > 0;

  // Use the query hook to fetch task
  const {
    data: task,
    isLoading,
    isError,
    error,
  } = useTaskQuery(safeTaskId, {
    enabled: isValidTaskId,
  });

  // Determine error message
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? 'An error occurred while loading the task'
        : null;

  // Handle not found state (no taskId, invalid taskId, or task not found)
  const isNotFound =
    !taskId || !isValidTaskId || (!isLoading && !isError && !task);

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tasks" style={{ color: '#3498db', textDecoration: 'none' }}>
          ← Back to Tasks
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && <LoadingSpinner />}

      {/* Error state */}
      {errorMessage && <ErrorMessage message={errorMessage} />}

      {/* Not found state */}
      {isNotFound && !isLoading && !errorMessage && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Task not found.</p>
      )}

      {/* Success state with task */}
      {!isLoading && !errorMessage && task && <TaskDetails task={task} />}
    </div>
  );
};
