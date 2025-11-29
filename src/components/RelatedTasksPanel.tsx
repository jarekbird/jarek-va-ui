import React from 'react';
import { Link } from 'react-router-dom';
import type { Task } from '../types';
import './RelatedTasksPanel.css';

interface RelatedTasksPanelProps {
  tasks: Task[];
  conversationId: string;
}

/**
 * Component that displays tasks linked to a conversation.
 * Shows a list of related tasks with links to their detail pages.
 */
export const RelatedTasksPanel: React.FC<RelatedTasksPanelProps> = ({
  tasks,
  // conversationId is kept in the interface for future API integration
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  conversationId: _conversationId,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="related-tasks-panel" data-testid="related-tasks-panel">
        <h3 className="related-tasks-panel__title">Related Tasks</h3>
        <p className="related-tasks-panel__empty">No related tasks found.</p>
      </div>
    );
  }

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
