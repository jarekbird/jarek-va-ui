import { useMemo } from 'react';
import { useTasksQuery } from './useTasksQuery';

/**
 * Query key factory for related tasks queries.
 * This ensures consistent query key structure for tasks filtered by conversation.
 */
export const relatedTasksQueryKeys = {
  all: ['relatedTasks'] as const,
  byConversation: (conversationId: string) =>
    [...relatedTasksQueryKeys.all, conversationId] as const,
};

/**
 * Hook to fetch tasks related to a specific conversation.
 *
 * This hook uses useTasksQuery internally with a conversation_id filter.
 * The API should support filtering by conversation_id for optimal performance.
 *
 * @param conversationId - The ID of the conversation to get related tasks for
 * @param options - Additional TanStack Query options
 * @returns Query result with filtered tasks, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useRelatedTasksQuery('conv-123');
 * const relatedTasks = data?.tasks || [];
 * ```
 */
export function useRelatedTasksQuery(
  conversationId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  // Memoize the params to avoid unnecessary re-renders
  const params = useMemo(
    () => (conversationId ? { conversation_id: conversationId } : undefined),
    [conversationId]
  );

  // Use useTasksQuery with conversation_id filter
  return useTasksQuery(params, {
    enabled: options?.enabled !== false && !!conversationId,
    staleTime: options?.staleTime,
    gcTime: options?.gcTime,
  });
}
