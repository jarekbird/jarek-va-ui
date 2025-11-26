import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConversationListView } from './components/ConversationListView';
import { ConversationDetailView } from './components/ConversationDetailView';
import { AgentConversationListView } from './components/AgentConversationListView';
import { AgentConversationDetailView } from './components/AgentConversationDetailView';
import { TaskListView } from './components/TaskListView';
import { TaskDetailView } from './components/TaskDetailView';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ConversationListView />} />
      <Route
        path="/conversation/:conversationId"
        element={<ConversationDetailView />}
      />
      <Route
        path="/agent-conversations"
        element={<AgentConversationListView />}
      />
      <Route
        path="/agent-conversation/:conversationId"
        element={<AgentConversationDetailView />}
      />
      <Route path="/tasks" element={<TaskListView />} />
      <Route path="/task/:id" element={<TaskDetailView />} />
    </Routes>
  );
};

export default App;
