import { QueryClient } from '@tanstack/react-query';

/**
 * Configured QueryClient with sensible defaults for the application.
 *
 * Defaults:
 * - retry: 1 - Retry failed requests once
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - gcTime: 10 minutes - Unused data is garbage collected after 10 minutes (formerly cacheTime)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});
