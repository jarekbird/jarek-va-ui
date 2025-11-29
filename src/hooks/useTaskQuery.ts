import { useQuery } from '@tanstack/react-query';
import { fetchTask } from '../api/tasks';

/**
 * Query key factory for a single task query.
 */
export const taskQueryKeys = {
  all: ['task'] as const,
  detail: (taskId: number) => [...taskQueryKeys.all, taskId] as const,
};

/**
 * Hook to fetch a single task by ID.
 *
 * The query key includes the taskId, so different tasks
 * will be cached separately.
 *
 * @param taskId - The ID of the task to fetch
 * @param options - Additional TanStack Query options
 * @returns Query result with task data, loading state, and error state
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTaskQuery(123);
 * ```
 */
export function useTaskQuery(
  taskId: number,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
  }
) {
  return useQuery({
    queryKey: taskQueryKeys.detail(taskId),
    queryFn: () => fetchTask(taskId),
    enabled: options?.enabled !== false && taskId > 0,
    staleTime: options?.staleTime,
    gcTime: options?.gcTime,
  });
}
