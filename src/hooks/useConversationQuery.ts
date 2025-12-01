import { useQuery } from '@tanstack/react-query';
import { fetchConversation } from '../api/conversations';

/**
 * Query key factory for a single conversation query.
 */
export const conversationQueryKeys = {
  all: ['conversation'] as const,
  detail: (conversationId: string) =>
    [...conversationQueryKeys.all, conversationId] as const,
};

/**
 * Hook to fetch a single conversation by ID.
 *
 * The query key includes the conversationId, so different conversations
 * will be cached separately.
 *
 * @param conversationId - The ID of the conversation to fetch
 * @param options - Additional TanStack Query options
 * @returns Query result with conversation data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useConversationQuery('conv-123');
 * ```
 */
export function useConversationQuery(
  conversationId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  return useQuery({
    queryKey: conversationQueryKeys.detail(conversationId),
    queryFn: () => fetchConversation(conversationId),
    enabled: options?.enabled !== false && !!conversationId,
    staleTime: options?.staleTime,
    gcTime: options?.gcTime,
  });
}
