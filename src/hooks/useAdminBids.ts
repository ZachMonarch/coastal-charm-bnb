import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';

export interface AdminBid {
  id: string;
  vendor_id: string;
  project_id: string | null;
  application_id: string | null;
  bid_amount: number;
  proposal_details: string;
  estimated_duration: string | null;
  status: string;
  submitted_at: string;
  admin_notes?: string;
  vendor_name?: string;
  vendor_email?: string;
  vendor_rating?: number;
  vendor_company?: string;
  project_title?: string;
  project_category?: string;
  project_status?: string;
}

export interface BidComment {
  id: string;
  bid_id: string;
  admin_id: string;
  comment: string;
  created_at: string;
  admin_name?: string;
}

export const useAdminBids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState<AdminBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBids = async () => {
    try {
      setLoading(true);
      
      // Fetch all bids
      const { data: bidsData, error: bidsError } = await supabase
        .from('vendor_bids')
        .select('id, vendor_id, project_id, application_id, bid_amount, proposal_details, estimated_duration, status, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(100);

      if (bidsError) throw bidsError;

      // Enrich with vendor and project info
      const enrichedBids = await Promise.all(
        (bidsData || []).map(async (bid) => {
          // Get vendor profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', bid.vendor_id)
            .single();

          // Get vendor company info
          const { data: vendorData } = await supabase
            .from('vendor_profiles')
            .select('company_name, rating')
            .eq('user_id', bid.vendor_id)
            .single();

          // Get project info
          let projectInfo = null;
          if (bid.project_id) {
            const { data: projectData } = await supabase
              .from('projects')
              .select('title, category, status')
              .eq('id', bid.project_id)
              .single();
            projectInfo = projectData;
          }

          return {
            ...bid,
            vendor_name: profileData?.full_name || 'Unknown',
            vendor_email: profileData?.email || '',
            vendor_company: vendorData?.company_name || '',
            vendor_rating: vendorData?.rating || 0,
            project_title: projectInfo?.title || 'Unknown Project',
            project_category: projectInfo?.category || '',
            project_status: projectInfo?.status || '',
          };
        })
      );

      setBids(enrichedBids);
    } catch (err) {
      console.error('Error fetching bids:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  };

  const updateBidStatus = async (bidId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vendor_bids')
        .update({ status })
        .eq('id', bidId);

      if (error) throw error;

      // Get bid details for notification
      const bid = bids.find(b => b.id === bidId);
      if (bid) {
        // Notify vendor
        await supabase.from('notifications').insert({
          user_id: bid.vendor_id,
          title: `Bid Status Updated`,
          message: `Your bid for "${bid.project_title}" has been updated to: ${status.replace('_', ' ')}`,
          type: status === 'awarded' ? 'success' : status === 'rejected' ? 'warning' : 'info',
          action_url: '/vendor/rfq'
        });
      }

      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status } : b));
      toast.success(`Bid status updated to ${status}`);
    } catch (err) {
      console.error('Error updating bid status:', err);
      toast.error('Failed to update bid status');
    }
  };

  const requestInfo = async (bidId: string, message: string) => {
    try {
      const bid = bids.find(b => b.id === bidId);
      if (!bid) throw new Error('Bid not found');

      // Update bid status
      await supabase
        .from('vendor_bids')
        .update({ status: 'info_requested' })
        .eq('id', bidId);

      // Create notification for vendor
      await supabase.from('notifications').insert({
        user_id: bid.vendor_id,
        title: 'Information Requested',
        message: `Admin requested additional information for your bid on "${bid.project_title}": ${message}`,
        type: 'warning',
        action_url: '/vendor/rfq'
      });

      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'info_requested' } : b));
      toast.success('Information request sent to vendor');
    } catch (err) {
      console.error('Error requesting info:', err);
      toast.error('Failed to send info request');
    }
  };

  const requestDocuments = async (bidId: string, documentTypes: string[]) => {
    try {
      const bid = bids.find(b => b.id === bidId);
      if (!bid) throw new Error('Bid not found');

      // Update bid status
      await supabase
        .from('vendor_bids')
        .update({ status: 'docs_requested' })
        .eq('id', bidId);

      // Create notification for vendor
      await supabase.from('notifications').insert({
        user_id: bid.vendor_id,
        title: 'Documents Requested',
        message: `Admin requested documents for your bid on "${bid.project_title}": ${documentTypes.join(', ')}`,
        type: 'warning',
        action_url: '/vendor/rfq'
      });

      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'docs_requested' } : b));
      toast.success('Document request sent to vendor');
    } catch (err) {
      console.error('Error requesting documents:', err);
      toast.error('Failed to send document request');
    }
  };

  const shortlistBid = async (bidId: string) => {
    await updateBidStatus(bidId, 'shortlisted');
  };

  const awardBid = async (bidId: string, projectId: string) => {
    try {
      const bid = bids.find(b => b.id === bidId);
      if (!bid) throw new Error('Bid not found');

      // Update bid status to awarded
      await supabase
        .from('vendor_bids')
        .update({ status: 'awarded' })
        .eq('id', bidId);

      // Reject other bids for this project
      await supabase
        .from('vendor_bids')
        .update({ status: 'rejected' })
        .eq('project_id', projectId)
        .neq('id', bidId);

      // Assign vendor to project
      await supabase
        .from('projects')
        .update({ 
          assigned_vendor_id: bid.vendor_id,
          status: 'in_progress'
        })
        .eq('id', projectId);

      // Notify winning vendor
      await supabase.from('notifications').insert({
        user_id: bid.vendor_id,
        title: 'Congratulations! Bid Awarded',
        message: `Your bid for "${bid.project_title}" has been awarded! You can now start working on the project.`,
        type: 'success',
        action_url: '/vendor/projects'
      });

      await fetchAllBids();
      toast.success('Bid awarded successfully');
    } catch (err) {
      console.error('Error awarding bid:', err);
      toast.error('Failed to award bid');
    }
  };

  const rejectBid = async (bidId: string, reason?: string) => {
    try {
      const bid = bids.find(b => b.id === bidId);
      if (!bid) throw new Error('Bid not found');

      await supabase
        .from('vendor_bids')
        .update({ status: 'rejected' })
        .eq('id', bidId);

      // Notify vendor
      await supabase.from('notifications').insert({
        user_id: bid.vendor_id,
        title: 'Bid Not Selected',
        message: reason 
          ? `Your bid for "${bid.project_title}" was not selected. Reason: ${reason}`
          : `Your bid for "${bid.project_title}" was not selected. Thank you for your submission.`,
        type: 'info',
        action_url: '/vendor/rfq'
      });

      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: 'rejected' } : b));
      toast.success('Bid rejected');
    } catch (err) {
      console.error('Error rejecting bid:', err);
      toast.error('Failed to reject bid');
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllBids();
    }
  }, [user]);

  return {
    bids,
    loading,
    error,
    refetch: fetchAllBids,
    updateBidStatus,
    requestInfo,
    requestDocuments,
    shortlistBid,
    awardBid,
    rejectBid
  };
};
