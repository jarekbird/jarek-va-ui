import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConversationListView } from './components/ConversationListView';
import { ConversationDetailView } from './components/ConversationDetailView';
import './styles/App.css';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ConversationListView />} />
      <Route
        path="/conversation/:conversationId"
        element={<ConversationDetailView />}
      />
    </Routes>
  );
};

export default App;
