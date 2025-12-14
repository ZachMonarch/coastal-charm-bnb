import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  due_date: string | null;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  order_index: number;
  completion_date: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  milestone_id: string;
  file_name: string;
  file_path: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  uploaded_at: string;
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
}

export interface ContractWithMilestones {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  location: string | null;
  deadline: string | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  updated_at: string;
  assigned_vendor_id: string | null;
  milestones: Milestone[];
  progress: number;
  totalValue: number;
  completedMilestones: number;
  nextMilestone: Milestone | null;
}

export function useContractDetails(contractId: string) {
  const { user } = useAuth();
  const [contract, setContract] = useState<ContractWithMilestones | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContractDetails = async () => {
    if (!user || !contractId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, title, description, category, status, budget_min, budget_max, deadline, location, skills_required, created_at, assigned_vendor_id, priority, updated_at')
        .eq('id', contractId)
        .eq('assigned_vendor_id', user.id)
        .single();

      if (projectError) throw projectError;

      // Fetch milestones
      const { data: milestones, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('id, name, description, status, amount, due_date, completion_date, order_index, project_id, completed_by, created_at, updated_at')
        .eq('project_id', contractId)
        .order('order_index');

      if (milestonesError) throw milestonesError;

      // Calculate progress and metrics
      const completedMilestones = milestones?.filter(m => m.status === 'completed').length || 0;
      const totalMilestones = milestones?.length || 0;
      const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
      const totalValue = milestones?.reduce((sum, m) => sum + (m.amount || 0), 0) || 0;
      const nextMilestone = milestones?.find(m => m.status !== 'completed') || null;

      const contractWithMilestones: ContractWithMilestones = {
        ...project,
        milestones: (milestones || []) as Milestone[],
        progress,
        totalValue,
        completedMilestones,
        nextMilestone: nextMilestone as Milestone | null
      };

      setContract(contractWithMilestones);

      // Fetch all deliverables for this contract's milestones
      if (milestones && milestones.length > 0) {
        const milestoneIds = milestones.map(m => m.id);
        const { data: deliverablesData, error: deliverablesError } = await supabase
          .from('milestone_deliverables')
          .select('id, milestone_id, file_name, file_path, file_url, file_size, mime_type, uploaded_by, uploaded_at, is_approved, approved_by, approved_at')
          .in('milestone_id', milestoneIds)
          .order('uploaded_at', { ascending: false })
          .limit(100);

        if (deliverablesError) throw deliverablesError;
        setDeliverables(deliverablesData || []);
      }

    } catch (err) {
      console.error('Error fetching contract details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contract details');
    } finally {
      setLoading(false);
    }
  };

  const markMilestoneComplete = async (milestoneId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({
          status: 'completed',
          completion_date: new Date().toISOString(),
          completed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', milestoneId);

      if (error) throw error;

      // Refresh contract details
      await fetchContractDetails();
    } catch (err) {
      console.error('Error marking milestone complete:', err);
      throw err;
    }
  };

  const uploadDeliverable = async (milestoneId: string, file: File) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${milestoneId}_${Date.now()}.${fileExt}`;
      const filePath = `deliverables/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      // Save deliverable record
      const { error: insertError } = await supabase
        .from('milestone_deliverables')
        .insert({
          milestone_id: milestoneId,
          file_name: file.name,
          file_path: filePath,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id
        });

      if (insertError) throw insertError;

      // Refresh deliverables
      await fetchContractDetails();
    } catch (err) {
      console.error('Error uploading deliverable:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchContractDetails();
  }, [contractId, user]);

  return {
    contract,
    deliverables,
    loading,
    error,
    markMilestoneComplete,
    uploadDeliverable,
    refetch: fetchContractDetails
  };
}