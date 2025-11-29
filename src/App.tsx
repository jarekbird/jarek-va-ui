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

const App: React.FC = () => {
  const elevenLabsEnabled = isElevenLabsEnabled();

  return (
    <Routes>
      <Route path="/" element={<ConversationListView />} />
      <Route
        path="/conversation/:conversationId"
        element={<ConversationDetailView />}
      />
      {elevenLabsEnabled && (
        <>
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
          <Route
            path="/agent-conversations"
            element={<AgentConversationListView />}
          />
          <Route
            path="/agent-conversation/:conversationId"
            element={<AgentConversationDetailView />}
          />
          <Route
            path="/agent-config"
            element={<AgentConfigView />}
          />
        </>
      )}
      <Route path="/task-dashboard" element={<TaskDashboard />} />
      <Route path="/tasks" element={<TaskListView />} />
      <Route path="/task/:id" element={<TaskDetailView />} />
    </Routes>
  );
};

export default App;
