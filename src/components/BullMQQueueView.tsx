/**
 * BullMQQueueView Component
 * Displays a simplified view of currently processing Bull MQ queues and agents
 */

import React, { useState, useEffect } from 'react';
import { listQueues, type QueueInfo } from '../api/queues';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import './BullMQQueueView.css';

export const BullMQQueueView: React.FC = () => {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQueues();
    // Refresh every 5 seconds
    const interval = setInterval(loadQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueues = async () => {
    try {
      setError(null);
      const data = await listQueues();
      setQueues(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load queues';
      setError(errorMessage);
      console.error('Failed to load queues:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (count: number): string => {
    if (count === 0) return '#95a5a6'; // gray
    if (count < 5) return '#3498db'; // blue
    if (count < 10) return '#f39c12'; // orange
    return '#e74c3c'; // red
  };

  return (
    <div className="bullmq-queue-view">
      <div className="bullmq-queue-view__header">
        <h3>Bull MQ Queues</h3>
        <button
          className="bullmq-queue-view__refresh"
          onClick={loadQueues}
          title="Refresh"
          aria-label="Refresh queues"
        >
          ↻
        </button>
      </div>
      {loading && queues.length === 0 && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && queues.length === 0 && (
        <div className="bullmq-queue-view__empty">
          <p>No queues found</p>
        </div>
      )}
      {!loading && !error && queues.length > 0 && (
        <div className="bullmq-queue-view__queues">
          {queues.map((queue) => {
            const hasActiveJobs = queue.active > 0 || queue.waiting > 0;

            return (
              <div
                key={queue.name}
                className={`bullmq-queue-view__queue ${hasActiveJobs ? 'bullmq-queue-view__queue--active' : ''}`}
              >
                <div className="bullmq-queue-view__queue-header">
                  <h4 className="bullmq-queue-view__queue-name">
                    {queue.name}
                  </h4>
                  {queue.agents.length > 0 && (
                    <span className="bullmq-queue-view__queue-agents">
                      {queue.agents.length} agent
                      {queue.agents.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="bullmq-queue-view__queue-stats">
                  <div className="bullmq-queue-view__stat">
                    <span className="bullmq-queue-view__stat-label">
                      Waiting:
                    </span>
                    <span
                      className="bullmq-queue-view__stat-value"
                      style={{ color: getStatusColor(queue.waiting) }}
                    >
                      {queue.waiting}
                    </span>
                  </div>
                  <div className="bullmq-queue-view__stat">
                    <span className="bullmq-queue-view__stat-label">
                      Active:
                    </span>
                    <span
                      className="bullmq-queue-view__stat-value"
                      style={{ color: getStatusColor(queue.active) }}
                    >
                      {queue.active}
                    </span>
                  </div>
                  <div className="bullmq-queue-view__stat">
                    <span className="bullmq-queue-view__stat-label">
                      Completed:
                    </span>
                    <span className="bullmq-queue-view__stat-value">
                      {queue.completed}
                    </span>
                  </div>
                  <div className="bullmq-queue-view__stat">
                    <span className="bullmq-queue-view__stat-label">
                      Failed:
                    </span>
                    <span
                      className="bullmq-queue-view__stat-value"
                      style={{
                        color: queue.failed > 0 ? '#e74c3c' : '#95a5a6',
                      }}
                    >
                      {queue.failed}
                    </span>
                  </div>
                  {queue.delayed > 0 && (
                    <div className="bullmq-queue-view__stat">
                      <span className="bullmq-queue-view__stat-label">
                        Delayed:
                      </span>
                      <span className="bullmq-queue-view__stat-value">
                        {queue.delayed}
                      </span>
                    </div>
                  )}
                </div>
                {queue.agents.length > 0 && (
                  <div className="bullmq-queue-view__queue-agents-list">
                    <div className="bullmq-queue-view__agents-label">
                      Agents:
                    </div>
                    <div className="bullmq-queue-view__agents">
                      {queue.agents.map((agent, index) => (
                        <span
                          key={index}
                          className="bullmq-queue-view__agent-tag"
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
