import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

describe('Layout Integration', () => {
  it('renders Layout with navigation for all routes', () => {
    render(
      <MemoryRouter initialEntries={['/conversations']}>
        <App />
      </MemoryRouter>
    );

    // Verify Layout navigation is present
    expect(screen.getByText('Conversations')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders Layout for conversation list route', () => {
    render(
      <MemoryRouter initialEntries={['/conversations']}>
        <App />
      </MemoryRouter>
    );

    // Layout navigation should be present
    expect(screen.getByText('Conversations')).toBeInTheDocument();
    // Route content should be present
    expect(screen.getByText('Conversation History')).toBeInTheDocument();
  });

  it('renders Layout for conversation detail route', () => {
    render(
      <MemoryRouter initialEntries={['/conversations/conv-123']}>
        <App />
      </MemoryRouter>
    );

    // Layout navigation should be present
    expect(screen.getByText('Conversations')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders Layout for task list route', () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <App />
      </MemoryRouter>
    );

    // Layout navigation should be present - check for navigation links
    const conversationsLinks = screen.getAllByText('Conversations');
    expect(conversationsLinks.length).toBeGreaterThan(0);
    const tasksLinks = screen.getAllByText('Tasks');
    expect(tasksLinks.length).toBeGreaterThan(0);
    // Verify navigation links have correct href
    expect(screen.getByRole('link', { name: 'Conversations' })).toHaveAttribute(
      'href',
      '/conversations'
    );
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute(
      'href',
      '/tasks'
    );
  });

  it('renders Layout for task detail route', () => {
    render(
      <MemoryRouter initialEntries={['/tasks/123']}>
        <App />
      </MemoryRouter>
    );

    // Layout navigation should be present - check for navigation links
    expect(screen.getByRole('link', { name: 'Conversations' })).toHaveAttribute(
      'href',
      '/conversations'
    );
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute(
      'href',
      '/tasks'
    );
  });
});
