import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data fresh for 30 seconds
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      retry: 2, // Retry failed requests twice
    },
  },
});
