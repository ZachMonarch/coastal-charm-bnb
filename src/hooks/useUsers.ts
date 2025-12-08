import { useState, useEffect, useMemo } from 'react';
import { UserAPI, UserSearchParams } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  name: string;
  lastLogin?: string;
}

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  sortBy?: 'created_at' | 'full_name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface UserStats {
  total: number;
  active: number;
  byRole: Record<string, number>;
}

const DEFAULT_PAGE_SIZE = 20;

export const useUsers = (filters: Partial<UserFilters> = {}, pageSize: number = DEFAULT_PAGE_SIZE) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [metadata, setMetadata] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [performance, setPerformance] = useState({
    queryTime: 0,
    cacheHit: false,
    cached: false
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams: UserSearchParams = {
        page: currentPage,
        pageSize,
        search: filters.search,
        role: filters.role,
        status: filters.status,
        sortBy: filters.sortBy || 'created_at',
        sortOrder: filters.sortOrder || 'desc'
      };

      const response = await UserAPI.getUsers(searchParams);
      
      // Transform data to include computed fields
      const transformedUsers: User[] = response.data.map(user => ({
        ...user,
        name: user.full_name || user.email.split('@')[0],
        lastLogin: user.updated_at // Approximation until we have real last_login tracking
      }));

      setUsers(transformedUsers);
      setMetadata(response.metadata);
      setPerformance(response.performance);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters, currentPage, pageSize]);

  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages: metadata.totalPages,
    totalCount: metadata.total,
    hasNextPage: metadata.hasNext,
    hasPreviousPage: metadata.hasPrevious,
    startItem: (currentPage - 1) * pageSize + 1,
    endItem: Math.min(currentPage * pageSize, metadata.total),
    performance
  }), [currentPage, metadata, pageSize, performance]);

  return {
    users,
    loading,
    error,
    pagination: paginationInfo,
    setCurrentPage,
    refetch: fetchUsers,
    clearCache: () => {
      // This would trigger a fresh fetch on next call
      setCurrentPage(1);
      fetchUsers();
    }
  };
};

// Hook for user statistics
export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    byRole: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const statsData = await UserAPI.getUserStats();
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user stats';
      setError(errorMessage);
      console.error('User stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};