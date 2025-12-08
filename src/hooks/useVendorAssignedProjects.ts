import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Project } from './useProjects';
import { logger } from '@/utils/logger';

interface ProjectFilters {
  status?: string;
  category?: string;
  priority?: string;
  dueDateFilter?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export const useVendorAssignedProjects = (filters?: ProjectFilters) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAssignedProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) return;

      let query = supabase
        .from('projects')
        .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, preferred_start_date, location, skills_required, created_at, created_by, assigned_vendor_id, property_id, tenant_id, updated_at')
        .eq('assigned_vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      let filteredData = (data as Project[]) || [];

      // Apply budget filter
      if (filters?.budgetMin || filters?.budgetMax) {
        filteredData = filteredData.filter(project => {
          const minBudget = project.budget_min || 0;
          const maxBudget = project.budget_max || 0;
          
          if (filters.budgetMin && maxBudget < filters.budgetMin) return false;
          if (filters.budgetMax && minBudget > filters.budgetMax) return false;
          
          return true;
        });
      }

      // Apply due date filter
      if (filters?.dueDateFilter && filters.dueDateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        filteredData = filteredData.filter(project => {
          if (!project.deadline) return false;
          
          const deadline = new Date(project.deadline);
          
          switch (filters.dueDateFilter) {
            case 'overdue':
              return deadline < today;
            case 'due_this_week':
              return deadline >= today && deadline <= nextWeek;
            case 'due_this_month':
              return deadline >= today && deadline <= nextMonth;
            default:
              return true;
          }
        });
      }

      setProjects(filteredData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assigned projects';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'vendor') {
      fetchAssignedProjects();
    }
  }, [user?.id, user?.role, filters?.status, filters?.category, filters?.priority, filters?.dueDateFilter, filters?.budgetMin, filters?.budgetMax]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('assigned-projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `assigned_vendor_id=eq.${user.id}`
        },
        () => {
          fetchAssignedProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    projects,
    loading,
    error,
    refetch: fetchAssignedProjects
  };
};