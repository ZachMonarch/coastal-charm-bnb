import { useEffect, useState, useCallback } from 'react';

/**
 * Standardized pagination hook with explicit field selection
 * Enforces best practices: explicit columns, server-side filtering, pagination
 * 
 * @param table - Supabase table name
 * @param columns - Explicit column list (never use '*')
 * @param options - Pagination and filtering options
 */

interface UsePaginatedQueryOptions<T> {
  pageSize?: number;
  initialPage?: number;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  enabled?: boolean;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

interface UsePaginatedQueryResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  refresh: () => void;
}

export function usePaginatedQuery<T = any>(
  supabaseClient: any,
  table: string,
  columns: string,
  options: UsePaginatedQueryOptions<T> = {}
): UsePaginatedQueryResult<T> {
  const {
    pageSize = 25,
    initialPage = 1,
    filters = {},
    orderBy,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);

  // Validate columns (prevent SELECT *)
  if (!columns || columns.trim() === '*' || columns.trim() === '') {
    throw new Error('usePaginatedQuery: explicit column selection required. Do not use "*"');
  }

  const fetchData = useCallback(async (page: number) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build query with explicit columns
      let query = supabaseClient
        .from(table)
        .select(columns, { count: 'exact' })
        .range(from, to);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: result, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setData(result || []);
      setTotalCount(count || 0);
      onSuccess?.(result || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
      console.error(`usePaginatedQuery error for ${table}:`, error);
    } finally {
      setLoading(false);
    }
  }, [supabaseClient, table, columns, pageSize, filters, orderBy, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const refresh = useCallback(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    refresh
  };
}
