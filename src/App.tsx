import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConversationListView } from './components/ConversationListView';
import { ConversationDetailView } from './components/ConversationDetailView';
import { AgentConversationListView } from './components/AgentConversationListView';
import { AgentConversationDetailView } from './components/AgentConversationDetailView';
import { AgentConfigView } from './components/AgentConfigView';
import { Dashboard } from './components/Dashboard';
import { TaskDashboard } from './components/TaskDashboard';
import { TaskListView } from './components/TaskListView';
import { TaskDetailView } from './components/TaskDetailView';
import { isElevenLabsEnabled } from './utils/feature-flags';
import './styles/App.css';

const FeatureDisabled: React.FC<{ featureName: string }> = ({
  featureName,
}) => {
  const flagValue = import.meta.env.VITE_ELEVENLABS_AGENT_ENABLED;
  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: '#2c3e50', marginBottom: '1rem' }}>
          {featureName} Unavailable
        </h2>
        <p
          style={{
            color: '#7f8c8d',
            marginBottom: '1rem',
            maxWidth: '650px',
          }}
        >
          This feature is currently disabled. To enable it, set{' '}
          <code
            style={{
              background: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
            }}
          >
            VITE_ELEVENLABS_AGENT_ENABLED
          </code>{' '}
          to{' '}
          <code
            style={{
              background: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
            }}
          >
            true
          </code>{' '}
          and rebuild/redeploy the UI.
        </p>
        <p style={{ color: '#95a5a6', fontSize: '0.85rem', marginTop: '1rem' }}>
          Current value:{' '}
          <code
            style={{
              background: '#e9ecef',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
            }}
          >
            {flagValue ?? '(not set)'}
          </code>
        </p>
        <p
          style={{ color: '#95a5a6', fontSize: '0.85rem', marginTop: '0.5rem' }}
        >
          Note: Vite env vars are build-time; changing runtime container env
          won’t affect an already-built bundle.
        </p>
      </div>
    </div>
  );
};

const NotFound: React.FC = () => (
  <div className="container">
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#7f8c8d' }}>
        This route isn’t available in the current build.
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  const elevenLabsEnabled = isElevenLabsEnabled();

  return (
    <Routes>
      <Route path="/" element={<ConversationListView />} />
      <Route
        path="/conversation/:conversationId"
        element={<ConversationDetailView />}
      />
      {/* Dashboard route shows disabled message when feature flag is off */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route
        path="/agent-conversations"
        element={
          elevenLabsEnabled ? (
            <AgentConversationListView />
          ) : (
            <FeatureDisabled featureName="Agent Conversations" />
          )
        }
      />
      <Route
        path="/agent-conversation/:conversationId"
        element={
          elevenLabsEnabled ? (
            <AgentConversationDetailView />
          ) : (
            <FeatureDisabled featureName="Agent Conversation" />
          )
        }
      />
      <Route
        path="/agent-config"
        element={
          elevenLabsEnabled ? (
            <AgentConfigView />
          ) : (
            <FeatureDisabled featureName="Agent Config" />
          )
        }
      />
      <Route path="/task-dashboard" element={<TaskDashboard />} />
      <Route path="/tasks/:taskId" element={<TaskDetailView />} />
      <Route path="/tasks" element={<TaskListView />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
