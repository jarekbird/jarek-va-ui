import React from 'react';
import { Link } from 'react-router-dom';
import { useRelatedTasksQuery } from '../hooks/useRelatedTasksQuery';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import './RelatedTasksPanel.css';

interface RelatedTasksPanelProps {
  conversationId: string;
}

/**
 * Component that displays tasks linked to a conversation.
 * Shows a list of related tasks with links to their detail pages.
 * Fetches tasks using the useRelatedTasksQuery hook.
 */
export const RelatedTasksPanel: React.FC<RelatedTasksPanelProps> = ({
  conversationId,
}) => {
  const { data, isLoading, isError, error } = useRelatedTasksQuery(
    conversationId,
    {
      enabled: !!conversationId,
    }
  );

  const tasks = data?.tasks || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="related-tasks-panel" data-testid="related-tasks-panel">
        <h3 className="related-tasks-panel__title">Related Tasks</h3>
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="related-tasks-panel" data-testid="related-tasks-panel">
        <h3 className="related-tasks-panel__title">Related Tasks</h3>
        <ErrorMessage
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load related tasks'
          }
        />
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="related-tasks-panel" data-testid="related-tasks-panel">
        <h3 className="related-tasks-panel__title">Related Tasks</h3>
        <p className="related-tasks-panel__empty">No related tasks found.</p>
      </div>
    );
  }

  // Tasks list
  return (
    <div className="related-tasks-panel" data-testid="related-tasks-panel">
      <h3 className="related-tasks-panel__title">Related Tasks</h3>
      <ul className="related-tasks-panel__list">
        {tasks.map((task) => (
          <li key={task.id} className="related-tasks-panel__item">
            <Link
              to={`/tasks/${task.id}`}
              className="related-tasks-panel__link"
              data-testid={`related-task-${task.id}`}
            >
              <div className="related-tasks-panel__task-info">
                <span className="related-tasks-panel__task-id">
                  Task #{task.id}
                </span>
                <span
                  className={`related-tasks-panel__status related-tasks-panel__status--${task.status_label}`}
                >
                  {task.status_label}
                </span>
              </div>
              <div className="related-tasks-panel__task-prompt">
                {task.prompt}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
