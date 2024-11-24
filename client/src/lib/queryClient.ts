import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Consider data stale immediately
      refetchOnWindowFocus: true, // Refetch when window regains focus
      retry: 3, // Retry failed requests 3 times
    },
  },
});
