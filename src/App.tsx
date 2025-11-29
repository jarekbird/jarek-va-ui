import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConversationListView } from './components/ConversationListView';
import { ConversationDetailView } from './components/ConversationDetailView';
import { TaskListView } from './components/TaskListView';
import { TaskDetailView } from './components/TaskDetailView';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/conversations" element={<ConversationListView />} />
      <Route
        path="/conversations/:conversationId"
        element={<ConversationDetailView />}
      />
      <Route path="/tasks" element={<TaskListView />} />
      <Route path="/tasks/:taskId" element={<TaskDetailView />} />
    </Routes>
  );
};

export default App;
