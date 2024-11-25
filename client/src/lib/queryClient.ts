import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Keep data fresh for 30 seconds
      gcTime: 60000, // Keep data in cache for 1 minute
      refetchOnWindowFocus: true,
      retry: 3,
    },
  },
});
