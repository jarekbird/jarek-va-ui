import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../Layout';

describe('Layout', () => {
  it('renders header with navigation links', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText('Conversations')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders children in main content area', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div data-testid="test-content">Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('highlights active navigation link for conversations', () => {
    render(
      <MemoryRouter initialEntries={['/conversations']}>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    const conversationsLink = screen.getByText('Conversations');
    expect(conversationsLink).toHaveClass('active');
  });

  it('highlights active navigation link for conversation detail', () => {
    render(
      <MemoryRouter initialEntries={['/conversations/conv-123']}>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    const conversationsLink = screen.getByText('Conversations');
    expect(conversationsLink).toHaveClass('active');
  });

  it('highlights active navigation link for tasks', () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    const tasksLink = screen.getByText('Tasks');
    expect(tasksLink).toHaveClass('active');
  });

  it('highlights active navigation link for task detail', () => {
    render(
      <MemoryRouter initialEntries={['/tasks/123']}>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    const tasksLink = screen.getByText('Tasks');
    expect(tasksLink).toHaveClass('active');
  });

  it('navigation links have correct href attributes', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>
    );

    const conversationsLink = screen.getByText('Conversations');
    const tasksLink = screen.getByText('Tasks');

    expect(conversationsLink).toHaveAttribute('href', '/conversations');
    expect(tasksLink).toHaveAttribute('href', '/tasks');
  });
});
