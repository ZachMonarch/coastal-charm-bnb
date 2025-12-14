import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';

export interface RFQProject {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  location?: string;
  skills_required: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VendorBidWithProject {
  id: string;
  vendor_id: string;
  project_id: string;
  application_id?: string;
  bid_amount: number;
  proposal_details: string;
  estimated_duration?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'awarded' | 'rejected' | 'expired' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  submitted_at: string;
  project?: RFQProject;
  admin_feedback?: string | null;
  feedback_at?: string | null;
  feedback_by?: string | null;
}

export interface DraftBid {
  project_id: string;
  bid_amount?: number;
  proposal_details?: string;
  estimated_duration?: string;
  last_saved: string;
}

export const useVendorRFQs = () => {
  const [availableRFQs, setAvailableRFQs] = useState<RFQProject[]>([]);
  const [myBids, setMyBids] = useState<VendorBidWithProject[]>([]);
  const [awardedProjects, setAwardedProjects] = useState<VendorBidWithProject[]>([]);
  const [draftBids, setDraftBids] = useState<DraftBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAvailableRFQs = async () => {
    try {
      // Fetch all open projects that vendors can bid on
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('id, title, description, category, priority, status, budget_min, budget_max, deadline, location, skills_required, created_by, created_at, updated_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        console.error('Error fetching available RFQs:', fetchError);
        setError(fetchError.message);
        setAvailableRFQs([]);
        return;
      }
      
      setAvailableRFQs(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch available RFQs';
      console.error('Error fetching available RFQs:', err);
      setError(errorMsg);
      setAvailableRFQs([]);
    }
  };

  const fetchMyBids = async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('vendor_bids')
        .select(`
          id,
          vendor_id,
          project_id,
          application_id,
          bid_amount,
          proposal_details,
          estimated_duration,
          status,
          submitted_at,
          admin_feedback,
          feedback_at,
          feedback_by,
          projects!vendor_bids_project_id_fkey (
            id,
            title,
            description,
            category,
            priority,
            status,
            budget_min,
            budget_max,
            deadline,
            location,
            skills_required,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('vendor_id', user.id)
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(bid => ({
        ...bid,
        project: bid.projects ? (Array.isArray(bid.projects) ? bid.projects[0] : bid.projects) : undefined
      }));
      
      setMyBids(transformedData as VendorBidWithProject[]);
    } catch (err) {
      console.error('Error fetching my bids:', err);
    }
  };

  const fetchAwardedProjects = async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('vendor_bids')
        .select(`
          id,
          vendor_id,
          project_id,
          application_id,
          bid_amount,
          proposal_details,
          estimated_duration,
          status,
          submitted_at,
          projects!vendor_bids_project_id_fkey (
            id,
            title,
            description,
            category,
            priority,
            status,
            budget_min,
            budget_max,
            deadline,
            location,
            skills_required,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('vendor_id', user.id)
        .eq('status', 'awarded')
        .order('submitted_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(bid => ({
        ...bid,
        project: bid.projects ? (Array.isArray(bid.projects) ? bid.projects[0] : bid.projects) : undefined
      }));
      
      setAwardedProjects(transformedData as VendorBidWithProject[]);
    } catch (err) {
      console.error('Error fetching awarded projects:', err);
    }
  };

  const loadDraftBids = () => {
    if (!user?.id) return;
    
    const saved = localStorage.getItem(`draft_bids_${user.id}`);
    if (saved) {
      try {
        setDraftBids(JSON.parse(saved));
      } catch (err) {
        console.error('Error loading draft bids:', err);
      }
    }
  };

  const saveDraftBid = (projectId: string, bidData: Partial<DraftBid>) => {
    if (!user?.id) return;

    const currentDrafts = draftBids.filter(d => d.project_id !== projectId);
    const newDraft: DraftBid = {
      project_id: projectId,
      ...bidData,
      last_saved: new Date().toISOString()
    };

    const updatedDrafts = [...currentDrafts, newDraft];
    setDraftBids(updatedDrafts);
    localStorage.setItem(`draft_bids_${user.id}`, JSON.stringify(updatedDrafts));
  };

  const deleteDraftBid = (projectId: string) => {
    if (!user?.id) return;

    const updatedDrafts = draftBids.filter(d => d.project_id !== projectId);
    setDraftBids(updatedDrafts);
    localStorage.setItem(`draft_bids_${user.id}`, JSON.stringify(updatedDrafts));
  };

  const submitBid = async (bidData: {
    project_id: string;
    bid_amount: number;
    proposal_details: string;
    estimated_duration?: string;
  }) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      // Fetch project details for application record
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('title, description, category, priority, budget_min, budget_max, location, deadline, property_id, preferred_start_date, created_by')
        .eq('id', bidData.project_id)
        .single();

      if (projectError) throw projectError;

      // Step 1: Create vendor_application record
      const { data: applicationData, error: appError } = await supabase
        .from('vendor_applications')
        .insert({
          user_id: user.id,
          project_title: projectData.title,
          project_description: projectData.description,
          project_type: projectData.category,
          status: 'submitted',
          priority: projectData.priority,
          budget_min: projectData.budget_min,
          budget_max: projectData.budget_max,
          location: projectData.location,
          preferred_start_date: projectData.preferred_start_date,
          deadline: projectData.deadline,
          property_id: projectData.property_id
        })
        .select()
        .single();

      if (appError) throw appError;

      // Step 2: Create vendor_bid linked to both application AND project
      // Note: vendor_bids.status allows 'open', 'in_progress', 'completed', 'cancelled'
      const { data, error } = await supabase
        .from('vendor_bids')
        .insert({
          vendor_id: user.id,
          project_id: bidData.project_id,
          application_id: applicationData.id,
          bid_amount: bidData.bid_amount,
          proposal_details: bidData.proposal_details,
          estimated_duration: bidData.estimated_duration,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Step 3: Create notification for admin
      await supabase.from('notifications').insert({
        user_id: projectData.created_by || user.id,
        title: 'New Bid Received',
        message: `${user.email} submitted a bid of $${bidData.bid_amount} for ${projectData.title}`,
        type: 'info',
        action_url: `/admin?tab=bids`
      });

      // Remove draft bid if it exists
      deleteDraftBid(bidData.project_id);
      
      // Refresh bids
      await fetchMyBids();
      
      return data;
    } catch (error) {
      throw new Error(`Failed to submit bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const withdrawBid = async (bidId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_bids')
        .delete()
        .eq('id', bidId);

      if (error) throw error;
      
      await fetchMyBids();
    } catch (error) {
      throw new Error(`Failed to withdraw bid: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateBidStatus = async (bidId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vendor_bids')
        .update({ status })
        .eq('id', bidId);

      if (error) throw error;
      
      await fetchMyBids();
      await fetchAwardedProjects();
    } catch (error) {
      throw new Error(`Failed to update bid status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchAvailableRFQs(),
          fetchMyBids(),
          fetchAwardedProjects()
        ]);
        loadDraftBids();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch RFQ data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  return {
    availableRFQs,
    myBids,
    awardedProjects,
    draftBids,
    loading,
    error,
    refetch: () => Promise.all([fetchAvailableRFQs(), fetchMyBids(), fetchAwardedProjects()]),
    saveDraftBid,
    deleteDraftBid,
    submitBid,
    withdrawBid,
    updateBidStatus
  };
};