import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ConversationList } from '../../components/ConversationList';
import { ConversationFilters } from '../../components/ConversationFilters';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useConversationsQuery } from '../../hooks/useConversationsQuery';
import { createConversation } from '../../api/conversations';
import type { ConversationFilterState } from '../../components/ConversationFilters';
import type { Conversation } from '../../types';

/**
 * Converts URL search params to ConversationFilterState
 */
function searchParamsToFilters(
  searchParams: URLSearchParams
): ConversationFilterState {
  const filters: ConversationFilterState = {};

  const search = searchParams.get('search');
  if (search) {
    filters.search = search;
  }

  const status = searchParams.get('status');
  if (status) {
    filters.status = status;
  }

  const sortBy = searchParams.get('sortBy');
  if (sortBy === 'createdAt' || sortBy === 'lastAccessedAt') {
    filters.sortBy = sortBy;
  }

  const sortOrder = searchParams.get('sortOrder');
  if (sortOrder === 'asc' || sortOrder === 'desc') {
    filters.sortOrder = sortOrder;
  }

  return filters;
}

/**
 * Converts ConversationFilterState to URL search params
 */
function filtersToSearchParams(
  filters: ConversationFilterState
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.sortBy) {
    params.set('sortBy', filters.sortBy);
  }

  if (filters.sortOrder) {
    params.set('sortOrder', filters.sortOrder);
  }

  return params;
}

export const ConversationsPage: React.FC = () => {
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize filters from URL search params
  const filters = React.useMemo(
    () => searchParamsToFilters(searchParams),
    [searchParams]
  );

  // Update URL search params when filters change
  const handleFiltersChange = React.useCallback(
    (newFilters: ConversationFilterState) => {
      const params = filtersToSearchParams(newFilters);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Extract API params from filters (excluding search which is client-side only)
  const apiParams = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { search, ...apiFilters } = filters;
    return Object.keys(apiFilters).length > 0 ? apiFilters : undefined;
  }, [filters]);

  // Use the query hook to fetch conversations with API-supported filters
  const { data, isLoading, isError, error, refetch } =
    useConversationsQuery(apiParams);

  // Apply client-side search filter if provided
  const conversations = React.useMemo(() => {
    const allConversations = data?.conversations ?? [];
    if (!filters.search) {
      return allConversations;
    }
    const searchLower = filters.search.toLowerCase();
    return allConversations.filter((conv: Conversation) =>
      conv.conversationId.toLowerCase().includes(searchLower)
    );
  }, [data?.conversations, filters.search]);

  // Extract conversation ID from URL if present (for highlighting active conversation)
  const activeConversationId = location.pathname.startsWith('/conversations/')
    ? location.pathname.split('/conversations/')[1]
    : null;

  const handleSelectConversation = (conversationId: string) => {
    // Navigation is handled by Link component in ConversationList
    // This handler is kept for compatibility but Link handles the actual navigation
    // The conversationId parameter is required by the ConversationList interface
    void conversationId; // Explicitly mark as used to satisfy linter
  };

  const handleNewConversation = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await createConversation({ queueType: 'api' });
      if (response.success && response.conversationId) {
        // Navigate to the new conversation
        navigate(`/conversations/${response.conversationId}`);
        // Refetch conversations list to include the new one
        await refetch();
      } else {
        setCreateError('Failed to create conversation');
      }
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : 'An error occurred while creating a new conversation'
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Determine error message
  const errorMessage =
    createError ||
    (isError && error instanceof Error
      ? error.message
      : isError
        ? 'An error occurred while loading conversations'
        : null);

  return (
    <div className="container">
      <div className="header-with-button">
        <h1>Conversation History</h1>
        <button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="new-conversation-button"
        >
          {isCreating ? 'Creating...' : '+ New Conversation'}
        </button>
      </div>

      {/* Filters */}
      <ConversationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Loading state */}
      {isLoading && conversations.length === 0 && <LoadingSpinner />}

      {/* Error state */}
      {errorMessage && <ErrorMessage message={errorMessage} />}

      {/* Success state with conversations */}
      {!isLoading && conversations.length > 0 && (
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
        />
      )}

      {/* Empty state */}
      {!isLoading && !errorMessage && conversations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          {filters.search
            ? 'No conversations match your search criteria.'
            : 'No conversations found.'}
        </p>
      )}
    </div>
  );
};
