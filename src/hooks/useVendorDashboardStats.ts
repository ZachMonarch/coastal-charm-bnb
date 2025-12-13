import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { logger } from '@/utils/logger';

export interface VendorDashboardStats {
  openRFQs: number;
  assignedProjects: number;
  pendingDocuments: number;
  unpaidInvoices: number;
  profileCompletion: number;
  nextDeadline: string | null;
  urgentTasks: number;
  totalApplications: number;
  completedProjects: number;
  rating: number;
  responseTime: string;
}

const DEFAULT_STATS: VendorDashboardStats = {
  openRFQs: 0,
  assignedProjects: 0,
  pendingDocuments: 0,
  unpaidInvoices: 0,
  profileCompletion: 0,
  nextDeadline: null,
  urgentTasks: 0,
  totalApplications: 0,
  completedProjects: 0,
  rating: 0,
  responseTime: '24h',
};

export function useVendorDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<VendorDashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Single optimized RPC call instead of 6 parallel queries
      const { data, error: rpcError } = await supabase.rpc('get_vendor_dashboard_stats', {
        p_vendor_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const statsData = data as Record<string, unknown>;
        setStats({
          openRFQs: (statsData.openRFQs as number) || 0,
          assignedProjects: (statsData.assignedProjects as number) || 0,
          pendingDocuments: (statsData.pendingDocuments as number) || 0,
          unpaidInvoices: (statsData.unpaidInvoices as number) || 0,
          profileCompletion: (statsData.profileCompletion as number) || 0,
          nextDeadline: (statsData.nextDeadline as string) || null,
          urgentTasks: (statsData.urgentTasks as number) || 0,
          totalApplications: (statsData.totalApplications as number) || 0,
          completedProjects: (statsData.completedProjects as number) || 0,
          rating: (statsData.rating as number) || 0,
          responseTime: (statsData.responseTime as string) || '24h',
        });
      }
    } catch (err) {
      logger.error('Error fetching vendor dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchStats();

    // Set up real-time subscriptions for live updates (debounced)
    let debounceTimer: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchStats, 500);
    };

    const projectsChannel = supabase
      .channel('vendor-dashboard-stats')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' }, 
        debouncedFetch
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vendor_documents', filter: `vendor_id=eq.${user.id}` }, 
        debouncedFetch
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vendor_payments', filter: `vendor_id=eq.${user.id}` }, 
        debouncedFetch
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimer);
      supabase.removeChannel(projectsChannel);
    };
  }, [user?.id, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
