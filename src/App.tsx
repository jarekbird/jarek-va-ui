import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ConversationsPage } from './routes/conversations/ConversationsPage';
import { ConversationDetailPage } from './routes/conversations/ConversationDetailPage';
import { TaskListView } from './components/TaskListView';
import { TaskDetailView } from './components/TaskDetailView';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/conversations" element={<ConversationsPage />} />
        <Route
          path="/conversations/:conversationId"
          element={<ConversationDetailPage />}
        />
        <Route path="/tasks" element={<TaskListView />} />
        <Route path="/tasks/:taskId" element={<TaskDetailView />} />
      </Routes>
    </Layout>
  );
};

export default App;
