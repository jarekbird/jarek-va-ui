import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

describe('Routing', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  describe('route definitions', () => {
    it('renders ConversationListView at /conversations', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/conversations']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );
      expect(screen.getByText('Conversation History')).toBeInTheDocument();
    });

    it('renders ConversationDetailView at /conversations/:conversationId', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/conversations/conv-123']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );
      // ConversationDetailView should be rendered (it will show loading/error initially)
      expect(
        screen.queryByText('Conversation History')
      ).not.toBeInTheDocument();
    });

    it('renders TaskListView at /tasks', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/tasks']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );
      // Check for h1 heading in main content (not navigation)
      const headings = screen.getAllByText('Tasks');
      expect(headings.length).toBeGreaterThan(0);
      // The h1 should be in the document
      const h1 = screen.getByRole('heading', { name: 'Tasks' });
      expect(h1).toBeInTheDocument();
    });

    it('renders TaskDetailView at /tasks/:taskId', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/tasks/123']}>
            <App />
          </MemoryRouter>
        </QueryClientProvider>
      );
      // TaskDetailView should be rendered (it will show loading/error initially)
      // Navigation will have "Tasks" link, but the h1 heading should not be present
      const headings = screen.queryAllByRole('heading', { name: 'Tasks' });
      expect(headings.length).toBe(0);
    });
  });

  describe('route parameters', () => {
    it('extracts conversationId from /conversations/:conversationId', () => {
      const TestComponent = () => {
        const { conversationId } = useParams<{ conversationId: string }>();
        return <div data-testid="conversation-id">{conversationId}</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/conversations/test-conv-123']}>
            <Routes>
              <Route
                path="/conversations/:conversationId"
                element={<TestComponent />}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
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
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/tasks/456']}>
            <Routes>
              <Route path="/tasks/:taskId" element={<TestComponent />} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('task-id')).toHaveTextContent('456');
    });
  });
});
