import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import App from '../App';

describe('Routing', () => {
  describe('route definitions', () => {
    it('renders ConversationListView at /', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );
      // Check for h1 heading in main content (not navigation)
      const h1 = screen.getByRole('heading', { name: 'Note Taking History' });
      expect(h1).toBeInTheDocument();
    });

    it('renders ConversationDetailView at /conversation/:conversationId', () => {
      render(
        <MemoryRouter initialEntries={['/conversation/conv-123']}>
          <App />
        </MemoryRouter>
      );
      // ConversationDetailView should be rendered (it will show loading/error initially)
      // Navigation will have "Note Taking History" link, but the h1 heading should not be present
      const headings = screen.queryAllByRole('heading', {
        name: 'Note Taking History',
      });
      expect(headings.length).toBe(0);
    });

    it('renders TaskListView at /tasks', () => {
      render(
        <MemoryRouter initialEntries={['/tasks']}>
          <App />
        </MemoryRouter>
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
        <MemoryRouter initialEntries={['/tasks/123']}>
          <App />
        </MemoryRouter>
      );
      // TaskDetailView should be rendered (it will show loading/error initially)
      // Navigation will have "Tasks" link, but the h1 heading should not be present
      const headings = screen.queryAllByRole('heading', { name: 'Tasks' });
      expect(headings.length).toBe(0);
    });
  });

  describe('route parameters', () => {
    it('extracts conversationId from /conversation/:conversationId', () => {
      const TestComponent = () => {
        const { conversationId } = useParams<{ conversationId: string }>();
        return <div data-testid="conversation-id">{conversationId}</div>;
      };

      render(
        <MemoryRouter initialEntries={['/conversation/test-conv-123']}>
          <Routes>
            <Route
              path="/conversation/:conversationId"
              element={<TestComponent />}
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('conversation-id')).toHaveTextContent(
        'test-conv-123'
      );
    });

    it('extracts taskId from /task/:id', () => {
      const TestComponent = () => {
        const { id } = useParams<{ id: string }>();
        return <div data-testid="task-id">{id}</div>;
      };

      render(
        <MemoryRouter initialEntries={['/task/456']}>
          <Routes>
            <Route path="/task/:id" element={<TestComponent />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('task-id')).toHaveTextContent('456');
    });
  });
});
