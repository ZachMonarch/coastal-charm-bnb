import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  location?: string;
  skills_required?: string[];
  created_by: string;
  assigned_vendor_id?: string;
  created_at: string;
  updated_at: string;
  property_id?: number;
  preferred_start_date?: string;
  documents?: any;
  attachments?: string[];
  requirements_documents?: string[];
}

export const useProjects = (filters?: { status?: string; category?: string }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('projects')
        .select('id, title, description, category, status, priority, budget_min, budget_max, deadline, location, created_by, assigned_vendor_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setProjects((data as Project[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user, filters]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  };
};

export const useVendorProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchVendorProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setProjects([]);
        setLoading(false);
        return;
      }

      // Fetch open projects OR projects assigned to this vendor
      // RLS policy allows vendors to see open projects + their assigned projects
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('id, title, description, category, status, priority, budget_min, budget_max, deadline, location, skills_required, created_at, assigned_vendor_id')
        .or(`status.eq.open,assigned_vendor_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        console.error('Error fetching vendor projects:', fetchError);
        throw fetchError;
      }

      setProjects((data as Project[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vendor projects';
      console.error('Vendor projects fetch error:', err);
      setError(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'vendor') {
      fetchVendorProjects();
    }
  }, [user]);

  return {
    projects,
    loading,
    error,
    refetch: fetchVendorProjects
  };
};