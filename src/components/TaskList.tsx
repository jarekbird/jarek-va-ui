import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  activeTaskId: number | null;
  onSelectTask: (taskId: number) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'ready':
      return '#3498db';
    case 'complete':
      return '#27ae60';
    case 'archived':
      return '#95a5a6';
    case 'backlogged':
      return '#f39c12';
    default:
      return '#7f8c8d';
  }
};

const getStatusBadgeStyle = (status: string): React.CSSProperties => {
  const color = getStatusColor(status);
  return {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75em',
    fontWeight: 'bold',
    backgroundColor: `${color}20`,
    color: color,
    textTransform: 'uppercase',
    marginRight: '10px',
  };
};

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeTaskId,
  onSelectTask,
}) => {
  const location = useLocation();

  // Determine active task from URL if not provided
  const currentTaskId =
    activeTaskId ||
    (location.pathname.startsWith('/task/')
      ? parseInt(location.pathname.split('/task/')[1], 10)
      : null);

  // Group tasks by status for better organization
  const tasksByStatus = tasks.reduce(
    (acc, task) => {
      const status = task.status_label;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  // Sort tasks within each status group by order, then id
  Object.keys(tasksByStatus).forEach((status) => {
    tasksByStatus[status].sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.id - b.id;
    });
  });

  // Define status order for display
  const statusOrder = ['ready', 'backlogged', 'complete', 'archived'];

  return (
    <div>
      {statusOrder.map((status) => {
        const statusTasks = tasksByStatus[status] || [];
        if (statusTasks.length === 0) return null;

        return (
          <div key={status} style={{ marginBottom: '30px' }}>
            <h3
              style={{
                color: getStatusColor(status),
                marginBottom: '10px',
                fontSize: '1.2em',
                textTransform: 'capitalize',
              }}
            >
              {status} ({statusTasks.length})
            </h3>
            <ul className="conversation-list">
              {statusTasks.map((task) => {
                const isActive = currentTaskId === task.id;
                const promptPreview =
                  task.prompt.length > 100
                    ? `${task.prompt.substring(0, 100)}...`
                    : task.prompt;

                return (
                  <li key={task.id} className={isActive ? 'active' : ''}>
                    <Link
                      to={`/task/${task.id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                      }}
                      onClick={() => {
                        onSelectTask(task.id);
                      }}
                    >
                      <div className="conversation-meta">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '5px',
                          }}
                        >
                          <span style={getStatusBadgeStyle(task.status_label)}>
                            {task.status_label}
                          </span>
                          <span className="conversation-id">
                            ID: {task.id}
                            {task.order !== 0 && ` | Order: ${task.order}`}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.9em',
                            color: '#2c3e50',
                            marginBottom: '5px',
                          }}
                        >
                          {promptPreview}
                        </div>
                        {task.createdat && (
                          <span className="conversation-date">
                            Created: {new Date(task.createdat).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};


