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

export const AgentConversationListView: React.FC = () => {
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
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAgentConversations();
      setConversations(data);
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

    // Sort conversations
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastAccessed':
          comparison = new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime();
          break;
        case 'messageCount':
          comparison = a.messages.length - b.messages.length;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
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

  return (
    <div className="container">
      <Navigation />
      <div className="header-with-button">
        <h1>Agent Conversations</h1>
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
          {(searchQuery || filterAgentId) && (
            <div style={{ fontSize: '0.9em', color: '#7f8c8d', alignSelf: 'flex-end', paddingBottom: '8px' }}>
              Showing {filteredAndSortedConversations.length} of {conversations.length} conversations
            </div>
          )}
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
    </div>
  );
};


