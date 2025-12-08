import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

// Optimized query hook with smart caching and error handling
export function useOptimizedQuery<T>(
  queryKey: string | string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const memoizedQueryKey = useMemo(() => 
    Array.isArray(queryKey) ? queryKey : [queryKey],
    [queryKey]
  );

  const memoizedQueryFn = useCallback(queryFn, [queryFn]);

  const defaultOptions: Partial<UseQueryOptions<T>> = {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  };

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: memoizedQueryFn,
    ...defaultOptions,
  });
}

// Hook for paginated queries with optimistic updates
export function useOptimizedPaginatedQuery<T>(
  queryKey: string | string[],
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  page: number = 1,
  pageSize: number = 20,
  options?: Omit<UseQueryOptions<{ data: T[]; total: number }>, 'queryKey' | 'queryFn'>
) {
  const memoizedQueryKey = useMemo(() => 
    Array.isArray(queryKey) ? [...queryKey, page, pageSize] : [queryKey, page, pageSize],
    [queryKey, page, pageSize]
  );

  const memoizedQueryFn = useCallback(() => queryFn(page, pageSize), [queryFn, page, pageSize]);

  const defaultOptions: Partial<UseQueryOptions<{ data: T[]; total: number }>> = {
    staleTime: 3 * 60 * 1000, // 3 minutes for paginated data
    gcTime: 8 * 60 * 1000, // 8 minutes
    placeholderData: (previousData) => previousData,
    ...options,
  };

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn: memoizedQueryFn,
    ...defaultOptions,
  });
}