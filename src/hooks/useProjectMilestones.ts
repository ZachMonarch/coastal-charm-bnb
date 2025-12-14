import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completion_date: string | null;
  amount: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const useProjectMilestones = (projectId: string) => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMilestones = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('project_milestones')
          .select('id, project_id, name, description, status, due_date, completion_date, amount, order_index, created_at, updated_at')
          .eq('project_id', projectId)
          .order('order_index', { ascending: true });

        if (fetchError) throw fetchError;
        setMilestones(data || []);
      } catch (err) {
        console.error('Error fetching milestones:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch milestones');
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [projectId]);

  return { milestones, loading, error };
};
