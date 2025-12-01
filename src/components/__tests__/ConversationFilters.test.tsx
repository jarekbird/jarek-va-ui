import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationFilters } from '../ConversationFilters';

describe('ConversationFilters', () => {
  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    expect(
      screen.getByPlaceholderText('Search conversations...')
    ).toBeInTheDocument();
  });

  it('renders status filter dropdown', () => {
    render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('renders sort by dropdown', () => {
    render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    expect(screen.getByText('Sort by...')).toBeInTheDocument();
  });

  it('calls onFiltersChange when search input changes', async () => {
    const user = userEvent.setup();
    render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    const searchInput = screen.getByPlaceholderText('Search conversations...');
    await user.type(searchInput, 'test search');

    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('calls onFiltersChange when status changes', async () => {
    const user = userEvent.setup();
    render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    const statusSelect = screen.getByText('All Statuses')
      .parentElement as HTMLSelectElement;
    await user.selectOptions(statusSelect, 'active');

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    );
  });

  it('calls onFiltersChange when sort by changes', async () => {
    const user = userEvent.setup();
    render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    const sortBySelect = screen.getByText('Sort by...')
      .parentElement as HTMLSelectElement;
    await user.selectOptions(sortBySelect, 'createdAt');

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'createdAt',
      })
    );
  });

  it('shows sort order dropdown when sortBy is selected', () => {
    render(
      <ConversationFilters
        filters={{ sortBy: 'createdAt' }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Descending')).toBeInTheDocument();
    expect(screen.getByText('Ascending')).toBeInTheDocument();
  });

  it('hides sort order dropdown when sortBy is not selected', () => {
    render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    expect(screen.queryByText('Descending')).not.toBeInTheDocument();
  });

  it('shows clear filters button when filters are applied', () => {
    render(
      <ConversationFilters
        filters={{ search: 'test', status: 'active' }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('hides clear filters button when no filters are applied', () => {
    render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument();
  });

  it('calls onFiltersChange with empty object when clear filters is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConversationFilters
        filters={{ search: 'test', status: 'active' }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByText('Clear Filters');
    await user.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('displays current filter values', () => {
    render(
      <ConversationFilters
        filters={{
          search: 'test search',
          status: 'active',
          sortBy: 'createdAt',
          sortOrder: 'asc',
        }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Search conversations...'
    ) as HTMLInputElement;
    expect(searchInput.value).toBe('test search');
  });

  it('calls onFiltersChange when sort order changes', async () => {
    const user = userEvent.setup();
    render(
      <ConversationFilters
        filters={{ sortBy: 'createdAt', sortOrder: 'desc' }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sortOrderSelect = screen.getByText('Descending')
      .parentElement as HTMLSelectElement;
    await user.selectOptions(sortOrderSelect, 'asc');

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'createdAt',
        sortOrder: 'asc',
      })
    );
  });

  it('removes search filter when input is cleared', async () => {
    const user = userEvent.setup();
    render(
      <ConversationFilters
        filters={{ search: 'test', status: 'active' }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Search conversations...'
    ) as HTMLInputElement;
    await user.clear(searchInput);

    // Should be called with filters without search
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    );
    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.not.objectContaining({
        search: expect.anything(),
      })
    );
  });

  it('handles all filters applied simultaneously', () => {
    render(
      <ConversationFilters
        filters={{
          search: 'query',
          status: 'archived',
          sortBy: 'lastAccessedAt',
          sortOrder: 'asc',
        }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(
      'Search conversations...'
    ) as HTMLInputElement;
    expect(searchInput.value).toBe('query');
  });

  it('defaults sort order to desc when sortBy is selected', () => {
    render(
      <ConversationFilters
        filters={{ sortBy: 'createdAt' }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sortOrderSelect = screen.getByText('Descending')
      .parentElement as HTMLSelectElement;
    expect(sortOrderSelect.value).toBe('desc');
  });

  it('handles clearing search input', async () => {
    const user = userEvent.setup();
    render(
      <ConversationFilters
        filters={{ search: 'initial' }}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Search conversations...'
    ) as HTMLInputElement;
    await user.clear(searchInput);

    // Should remove search from filters (clear triggers onChange with empty value)
    expect(mockOnFiltersChange).toHaveBeenCalled();
  });

  it('renders all filter controls', () => {
    const { container } = render(
      <ConversationFilters filters={{}} onFiltersChange={mockOnFiltersChange} />
    );

    expect(
      screen.getByPlaceholderText('Search conversations...')
    ).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('Sort by...')).toBeInTheDocument();
    expect(
      container.querySelector('.conversation-filters')
    ).toBeInTheDocument();
  });
});
