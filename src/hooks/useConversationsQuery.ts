import { useQuery } from '@tanstack/react-query';
import {
  fetchConversations,
  type FetchConversationsParams,
} from '../api/conversations';

/**
 * Query key factory for conversations queries.
 * This ensures consistent query key structure across the application.
 */
export const conversationsQueryKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationsQueryKeys.all, 'list'] as const,
  list: (params?: FetchConversationsParams) =>
    [...conversationsQueryKeys.lists(), params] as const,
};

/**
 * Hook to fetch conversations with optional filter and pagination parameters.
 *
 * The query key includes the filter/pagination params, so different parameter
 * combinations will be cached separately.
 *
 * @param params - Optional filter and pagination parameters
 * @param options - Additional TanStack Query options
 * @returns Query result with conversations data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useConversationsQuery({ page: 1, limit: 10 });
 * ```
 */
export function useConversationsQuery(
  params?: FetchConversationsParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  return useQuery({
    queryKey: conversationsQueryKeys.list(params),
    queryFn: () => fetchConversations(params),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
    gcTime: options?.gcTime,
  });
}
