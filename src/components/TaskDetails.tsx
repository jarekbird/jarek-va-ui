import React from 'react';
import type { Task } from '../types';

interface TaskDetailsProps {
  task: Task | null;
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
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.85em',
    fontWeight: 'bold',
    backgroundColor: `${color}20`,
    color: color,
    textTransform: 'uppercase',
    marginLeft: '10px',
  };
};

export const TaskDetails: React.FC<TaskDetailsProps> = ({ task }) => {
  if (!task) {
    return null;
  }

  return (
    <div className="conversation-details">
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}
      >
        <h2 style={{ margin: 0, flex: 1 }}>Task #{task.id}</h2>
        <span style={getStatusBadgeStyle(task.status_label)}>
          {task.status_label}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{ color: '#2c3e50', marginBottom: '10px', fontSize: '1.2em' }}
        >
          Prompt
        </h3>
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontFamily: 'inherit',
            lineHeight: '1.6',
          }}
        >
          {task.prompt}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div
            style={{
              fontSize: '0.85em',
              color: '#7f8c8d',
              marginBottom: '5px',
            }}
          >
            Status
          </div>
          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {task.status_label} ({task.status})
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div
            style={{
              fontSize: '0.85em',
              color: '#7f8c8d',
              marginBottom: '5px',
            }}
          >
            Order
          </div>
          <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {task.order}
          </div>
        </div>

        {task.uuid && (
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div
              style={{
                fontSize: '0.85em',
                color: '#7f8c8d',
                marginBottom: '5px',
              }}
            >
              UUID
            </div>
            <div
              style={{
                fontWeight: 'bold',
                color: '#2c3e50',
                fontSize: '0.9em',
                wordBreak: 'break-all',
              }}
            >
              {task.uuid}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
        }}
      >
        {task.createdat && (
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div
              style={{
                fontSize: '0.85em',
                color: '#7f8c8d',
                marginBottom: '5px',
              }}
            >
              Created At
            </div>
            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
              {new Date(task.createdat).toLocaleString()}
            </div>
          </div>
        )}

        {task.updatedat && (
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
            }}
          >
            <div
              style={{
                fontSize: '0.85em',
                color: '#7f8c8d',
                marginBottom: '5px',
              }}
            >
              Updated At
            </div>
            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
              {new Date(task.updatedat).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


