import { useQuery } from '@tanstack/react-query';
import { fetchTasks, type FetchTasksParams } from '../api/tasks';

/**
 * Query key factory for tasks queries.
 * This ensures consistent query key structure across the application.
 */
export const tasksQueryKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksQueryKeys.all, 'list'] as const,
  list: (params?: FetchTasksParams) =>
    [...tasksQueryKeys.lists(), params] as const,
};

/**
 * Hook to fetch tasks with optional filter and pagination parameters.
 *
 * The query key includes the filter/pagination params, so different parameter
 * combinations will be cached separately.
 *
 * @param params - Optional filter and pagination parameters
 * @param options - Additional TanStack Query options
 * @returns Query result with tasks data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTasksQuery({ page: 1, limit: 10 });
 * ```
 */
export function useTasksQuery(
  params?: FetchTasksParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  return useQuery({
    queryKey: tasksQueryKeys.list(params),
    queryFn: () => fetchTasks(params),
    enabled: options?.enabled,
    staleTime: options?.staleTime,
    gcTime: options?.gcTime,
  });
}
