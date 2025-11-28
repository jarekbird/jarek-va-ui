import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AgentConversationList } from './AgentConversationList';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { Navigation } from './Navigation';
import {
  listAgentConversations,
  createAgentConversation,
} from '../api/agent-conversations';
import type { AgentConversation } from '../types/agent-conversation';

export interface AgentConversationListViewProps {
  onConversationSelect?: (conversationId: string) => void;
  showNavigation?: boolean;
  showContainer?: boolean;
}

export const AgentConversationListView: React.FC<AgentConversationListViewProps> = ({
  onConversationSelect,
  showNavigation = true,
  showContainer = true,
}) => {
  const [conversations, setConversations] = React.useState<AgentConversation[]>(
    []
  );
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [filterAgentId, setFilterAgentId] = React.useState<string>('');
  const [sortBy, setSortBy] = React.useState<'created' | 'lastAccessed' | 'messageCount'>('lastAccessed');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState<number>(1);
  const [pageSize] = React.useState<number>(20);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    loadConversations();
  }, [page, sortBy, sortOrder]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (page - 1) * pageSize;
      // Map frontend sortBy values to backend sortBy values
      const backendSortBy = sortBy === 'created' ? 'createdAt' : sortBy === 'lastAccessed' ? 'lastAccessedAt' : 'messageCount';
      const response = await listAgentConversations({ 
        limit: pageSize, 
        offset,
        sortBy: backendSortBy,
        sortOrder,
      });
      setConversations(response.conversations);
      setTotalCount(response.pagination.total);
    } catch (err) {
      let errorMessage = 'An error occurred while loading agent conversations';
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'Network error: Please check your connection and try again';
        } else if (err.message.includes('404')) {
          errorMessage = 'Service not found. Please check if the backend is running.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error: Please try again in a moment';
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Extract conversation ID from URL if present (for highlighting active conversation)
  const activeConversationId = location.pathname.startsWith(
    '/agent-conversation/'
  )
    ? location.pathname.split('/agent-conversation/')[1]
    : null;

  const handleSelectConversation = (conversationId: string) => {
    // Navigation is handled by Link component in AgentConversationList
    // This handler is kept for compatibility but Link handles the actual navigation
    // The conversationId parameter is required by the AgentConversationList interface
    void conversationId; // Explicitly mark as used to satisfy linter
  };

  // Filter and sort conversations
  const filteredAndSortedConversations = React.useMemo(() => {
    let filtered = conversations;

    // Filter by agent ID
    if (filterAgentId) {
      filtered = filtered.filter(
        (conv) => conv.agentId?.toLowerCase().includes(filterAgentId.toLowerCase())
      );
    }

    // Filter by search query (searches in conversation ID and message content)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        // Check conversation ID
        if (conv.conversationId.toLowerCase().includes(query)) {
          return true;
        }
        // Check agent ID
        if (conv.agentId?.toLowerCase().includes(query)) {
          return true;
        }
        // Check message content
        return conv.messages.some((msg) =>
          msg.content.toLowerCase().includes(query)
        );
      });
    }

    // Sorting is now handled by the backend, so we just return filtered results
    // The backend will return conversations already sorted according to sortBy and sortOrder
    return filtered;
  }, [conversations, searchQuery, filterAgentId, sortBy, sortOrder]);

  // Get unique agent IDs for filter dropdown
  const uniqueAgentIds = React.useMemo(() => {
    const agentIds = conversations
      .map((conv) => conv.agentId)
      .filter((id): id is string => !!id);
    return Array.from(new Set(agentIds)).sort();
  }, [conversations]);

  const handleNewConversation = async () => {
    if (isCreating) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await createAgentConversation();
      if (response.success && response.conversationId) {
        // Navigate to the new conversation
        navigate(`/agent-conversation/${response.conversationId}`);
        // Reload conversations list to include the new one
        await loadConversations();
      } else {
        setError('Failed to create agent conversation');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while creating a new agent conversation'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const content = (
    <>
      {showNavigation && <Navigation />}
      <div className="header-with-button">
        {showContainer && <h1>Agent Conversations</h1>}
        {!showContainer && <h2 style={{ margin: 0, marginBottom: '10px' }}>Agent Conversations</h2>}
        <button
          onClick={handleNewConversation}
          disabled={isCreating}
          className="new-conversation-button"
        >
          {isCreating ? 'Creating...' : '+ New Agent Conversation'}
        </button>
      </div>
      <div className="filters-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label htmlFor="search-input" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#2c3e50' }}>
              Search:
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Search conversations, messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9em',
              }}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <label htmlFor="agent-filter" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#2c3e50' }}>
              Filter by Agent:
            </label>
            <select
              id="agent-filter"
              value={filterAgentId}
              onChange={(e) => setFilterAgentId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9em',
              }}
            >
              <option value="">All Agents</option>
              {uniqueAgentIds.map((agentId) => (
                <option key={agentId} value={agentId}>
                  {agentId}
                </option>
              ))}
            </select>
          </div>
          {(searchQuery || filterAgentId) && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterAgentId('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9em',
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '150px' }}>
            <label htmlFor="sort-by" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#2c3e50' }}>
              Sort by:
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'created' | 'lastAccessed' | 'messageCount')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9em',
              }}
            >
              <option value="lastAccessed">Last Accessed</option>
              <option value="created">Created Date</option>
              <option value="messageCount">Message Count</option>
            </select>
          </div>
          <div style={{ minWidth: '120px' }}>
            <label htmlFor="sort-order" style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#2c3e50' }}>
              Order:
            </label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9em',
              }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div style={{ fontSize: '0.9em', color: '#7f8c8d', alignSelf: 'flex-end', paddingBottom: '8px' }}>
            {searchQuery || filterAgentId ? (
              <>Showing {filteredAndSortedConversations.length} of {conversations.length} conversations</>
            ) : (
              <>Showing {conversations.length} of {totalCount} conversations</>
            )}
          </div>
        </div>
      </div>
      {loading && conversations.length === 0 && <LoadingSpinner />}
      {error && (
        <div>
          <ErrorMessage message={error} />
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              onClick={loadConversations}
              className="retry-button"
              style={{
                padding: '8px 16px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {!loading && filteredAndSortedConversations.length > 0 && (
        <AgentConversationList
          conversations={filteredAndSortedConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onConversationSelect={onConversationSelect}
        />
      )}
      {!loading && !error && conversations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          No agent conversations found.
        </p>
      )}
      {!loading && !error && conversations.length > 0 && filteredAndSortedConversations.length === 0 && (
        <p style={{ textAlign: 'center', color: '#7f8c8d' }}>
          No conversations match your search criteria.
        </p>
      )}
      
      {/* Pagination controls */}
      {!loading && !error && totalCount > pageSize && !searchQuery && !filterAgentId && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '10px', 
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: '1px solid #ecf0f1'
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              backgroundColor: page === 1 ? '#ecf0f1' : '#3498db',
              color: page === 1 ? '#95a5a6' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <span style={{ color: '#2c3e50' }}>
            Page {page} of {Math.ceil(totalCount / pageSize)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
            disabled={page >= Math.ceil(totalCount / pageSize)}
            style={{
              padding: '8px 16px',
              backgroundColor: page >= Math.ceil(totalCount / pageSize) ? '#ecf0f1' : '#3498db',
              color: page >= Math.ceil(totalCount / pageSize) ? '#95a5a6' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: page >= Math.ceil(totalCount / pageSize) ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      )}
    </>
  );

  if (showContainer) {
    return <div className="container">{content}</div>;
  }

  return <div className="agent-conversation-list-view-panel">{content}</div>;
};


