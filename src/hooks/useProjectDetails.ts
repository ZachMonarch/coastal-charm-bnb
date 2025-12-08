import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Project } from './useProjects';
import { secureErrorHandler } from '@/utils/secureErrorHandler';

interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
  is_required_for_bidding?: boolean;
}

interface ProjectActivity {
  id: string;
  action: string;
  created_at: string;
  user_id?: string;
  old_values?: any;
  new_values?: any;
  details?: any;
}

export const useProjectDetails = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title, description, category, status, budget_min, budget_max, deadline, created_at, created_by, assigned_vendor_id, priority, skills_required, location, property_id, preferred_start_date, documents, attachments')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Check if vendor has access to this project
      if (projectData.assigned_vendor_id !== user?.id && !user?.role?.includes('admin')) {
        throw new Error('Access denied to this project');
      }

      setProject(projectData as Project);

      // Fetch project documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('project_documents')
        .select('id, project_id, file_name, file_path, file_type, file_size, uploaded_by, created_at, is_required_for_bidding')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData as ProjectDocument[]);

      // Fetch project activity (audit logs)
      const { data: activityData, error: activityError } = await supabase
        .from('audit_logs')
        .select('id, action, created_at, user_id, old_values, new_values')
        .eq('table_name', 'projects')
        .eq('record_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activityError) throw activityError;
      setActivities(activityData as ProjectActivity[]);

    } catch (err) {
      const safeError = secureErrorHandler.handleError(err, {
        endpoint: 'project_details',
        userId: user?.id,
        action: 'fetch'
      });
      setError(safeError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && user) {
      fetchProjectDetails();
    }
  }, [projectId, user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-${projectId}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        () => {
          fetchProjectDetails();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_documents',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchProjectDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    project,
    documents,
    activities,
    loading,
    error,
    refetch: fetchProjectDetails
  };
};