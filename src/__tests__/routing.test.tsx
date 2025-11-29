import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import App from '../App';

describe('Routing', () => {
  describe('route definitions', () => {
    it('renders ConversationListView at /conversations', () => {
      render(
        <MemoryRouter initialEntries={['/conversations']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByText('Conversation History')).toBeInTheDocument();
    });

    it('renders ConversationDetailView at /conversations/:conversationId', () => {
      render(
        <MemoryRouter initialEntries={['/conversations/conv-123']}>
          <App />
        </MemoryRouter>
      );
      // ConversationDetailView should be rendered (it will show loading/error initially)
      expect(
        screen.queryByText('Conversation History')
      ).not.toBeInTheDocument();
    });

    it('renders TaskListView at /tasks', () => {
      render(
        <MemoryRouter initialEntries={['/tasks']}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });

    it('renders TaskDetailView at /tasks/:taskId', () => {
      render(
        <MemoryRouter initialEntries={['/tasks/123']}>
          <App />
        </MemoryRouter>
      );
      // TaskDetailView should be rendered (it will show loading/error initially)
      expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
    });
  });

  describe('route parameters', () => {
    it('extracts conversationId from /conversations/:conversationId', () => {
      const TestComponent = () => {
        const { conversationId } = useParams<{ conversationId: string }>();
        return <div data-testid="conversation-id">{conversationId}</div>;
      };

      render(
        <MemoryRouter initialEntries={['/conversations/test-conv-123']}>
          <Routes>
            <Route
              path="/conversations/:conversationId"
              element={<TestComponent />}
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('conversation-id')).toHaveTextContent(
        'test-conv-123'
      );
    });

    it('extracts taskId from /tasks/:taskId', () => {
      const TestComponent = () => {
        const { taskId } = useParams<{ taskId: string }>();
        return <div data-testid="task-id">{taskId}</div>;
      };

      render(
        <MemoryRouter initialEntries={['/tasks/456']}>
          <Routes>
            <Route path="/tasks/:taskId" element={<TestComponent />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('task-id')).toHaveTextContent('456');
    });
  });
});
