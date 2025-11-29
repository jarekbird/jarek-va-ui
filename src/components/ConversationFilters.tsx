import React from 'react';
import type { FetchConversationsParams } from '../api/conversations';

/**
 * Extended filter type that includes UI-only filters like search
 * that may not be directly supported by the API
 */
export interface ConversationFilterState extends FetchConversationsParams {
  /** Search query (client-side filtering may be needed) */
  search?: string;
}

interface ConversationFiltersProps {
  filters: ConversationFilterState;
  onFiltersChange: (filters: ConversationFilterState) => void;
}

/**
 * Presentational component that renders filter inputs for conversations.
 * Provides search, status, and date filtering options.
 */
export const ConversationFilters: React.FC<ConversationFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value || undefined,
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      status: e.target.value || undefined,
    });
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      sortBy: e.target.value as 'createdAt' | 'lastAccessedAt' | undefined,
    });
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      sortOrder: e.target.value as 'asc' | 'desc' | undefined,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="conversation-filters" style={{ marginBottom: '20px' }}>
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder="Search conversations..."
          value={filters.search || ''}
          onChange={handleSearchChange}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            flex: '1',
            minWidth: '200px',
          }}
        />

        <select
          value={filters.status || ''}
          onChange={handleStatusChange}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={filters.sortBy || ''}
          onChange={handleSortByChange}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <option value="">Sort by...</option>
          <option value="createdAt">Created Date</option>
          <option value="lastAccessedAt">Last Accessed</option>
        </select>

        {filters.sortBy && (
          <select
            value={filters.sortOrder || 'desc'}
            onChange={handleSortOrderChange}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        )}

        {(filters.search ||
          filters.status ||
          filters.sortBy ||
          filters.sortOrder) && (
          <button
            onClick={handleClearFilters}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
