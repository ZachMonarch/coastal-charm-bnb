import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useState } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider - React Query Setup
 * 
 * Configuration:
 * - staleTime: 30s (data considered fresh for 30 seconds)
 * - gcTime: 5min (garbage collection after 5 minutes of inactivity)
 * - retry: 1 (single retry on failure)
 * - refetchOnWindowFocus: false (don't refetch when window regains focus)
 * 
 * Features:
 * - Automatic caching and deduplication
 * - Background refetching
 * - Optimistic updates
 * - DevTools in development mode
 * 
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30 seconds
            gcTime: 5 * 60_000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
