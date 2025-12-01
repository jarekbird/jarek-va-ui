import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Navigation } from './Navigation';

interface AgentConfig {
  agentId: string | null;
  agentUrl: string;
  cursorRunnerUrl: string;
  webhookSecretConfigured: boolean;
  redisUrl: string;
  hasApiKey: boolean;
}

interface HealthStatus {
  service: string;
  status: string;
  dependencies: {
    redis: string;
    cursorRunner: string;
  };
  timestamp: string;
}

export const AgentConfigView: React.FC = () => {
  const [config, setConfig] = React.useState<AgentConfig | null>(null);
  const [health, setHealth] = React.useState<HealthStatus | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  React.useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([loadConfig(), loadHealth()]);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const loadConfig = async () => {
    try {
      const baseUrl = import.meta.env.VITE_ELEVENLABS_AGENT_URL || '';
      const url = baseUrl ? `${baseUrl}/config` : '/config';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.config) {
        setConfig(data.config);
      } else {
        throw new Error(data.error || 'Failed to load configuration');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load configuration'
      );
    }
  };

  const loadHealth = async () => {
    try {
      const baseUrl = import.meta.env.VITE_ELEVENLABS_AGENT_URL || '';
      const url = baseUrl ? `${baseUrl}/config/health` : '/config/health';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to load health status: ${response.statusText}`);
      }

      const data = await response.json();
      setHealth(data);
    } catch (err) {
      // Health check errors are non-critical
      console.warn('Failed to load health status:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([loadConfig(), loadHealth()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'connected':
        return '#27ae60';
      case 'degraded':
        return '#f39c12';
      case 'disconnected':
      case 'unhealthy':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
      case 'connected':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'disconnected':
      case 'unhealthy':
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <div className="container">
      <Navigation />
      <div className="header-with-button">
        <h1>Agent Configuration</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && config && (
        <div>
          <div className="config-section">
            <h2>Configuration</h2>
            <div className="config-grid">
              <div className="config-item">
                <strong>Agent ID:</strong>
                <span>{config.agentId || 'Not configured'}</span>
              </div>
              <div className="config-item">
                <strong>Agent URL:</strong>
                <code>{config.agentUrl}</code>
              </div>
              <div className="config-item">
                <strong>Cursor Runner URL:</strong>
                <code>{config.cursorRunnerUrl}</code>
              </div>
              <div className="config-item">
                <strong>Webhook Secret:</strong>
                <span>
                  {config.webhookSecretConfigured
                    ? '✓ Configured'
                    : '✗ Not configured'}
                </span>
              </div>
              <div className="config-item">
                <strong>API Key:</strong>
                <span>
                  {config.hasApiKey ? '✓ Configured' : '✗ Not configured'}
                </span>
              </div>
              <div className="config-item">
                <strong>Redis:</strong>
                <span>{config.redisUrl}</span>
              </div>
            </div>
          </div>

          {health && (
            <div className="config-section" style={{ marginTop: '30px' }}>
              <h2>Health Status</h2>
              <div className="health-status">
                <div className="health-item">
                  <strong>Service:</strong>
                  <span style={{ color: getStatusColor(health.status) }}>
                    {getStatusIcon(health.status)} {health.status}
                  </span>
                </div>
                <div className="health-item">
                  <strong>Redis:</strong>
                  <span
                    style={{ color: getStatusColor(health.dependencies.redis) }}
                  >
                    {getStatusIcon(health.dependencies.redis)}{' '}
                    {health.dependencies.redis}
                  </span>
                </div>
                <div className="health-item">
                  <strong>Cursor Runner:</strong>
                  <span
                    style={{
                      color: getStatusColor(health.dependencies.cursorRunner),
                    }}
                  >
                    {getStatusIcon(health.dependencies.cursorRunner)}{' '}
                    {health.dependencies.cursorRunner}
                  </span>
                </div>
                <div
                  className="health-item"
                  style={{
                    marginTop: '10px',
                    fontSize: '0.9em',
                    color: '#7f8c8d',
                  }}
                >
                  Last updated: {new Date(health.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
