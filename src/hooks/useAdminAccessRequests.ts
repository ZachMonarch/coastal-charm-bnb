import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface AccessRequestAdmin {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role_requested: 'vendor' | 'property_manager';
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export function useAdminAccessRequests() {
  const { user, hasRole } = useAuth();
  const [requests, setRequests] = useState<AccessRequestAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdmin = hasRole('admin');

  // Fetch all pending requests
  const fetchRequests = async (statusFilter?: 'pending' | 'approved' | 'rejected' | 'all') => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('user_approval_requests')
        .select('id, user_id, email, full_name, role_requested, status, admin_notes, reviewed_by, company_name, phone, created_at, reviewed_at')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching access requests:', error);
        toast.error('Failed to load access requests');
      } else {
        setRequests((data || []) as AccessRequestAdmin[]);
      }
    } catch (err) {
      logger.error('Exception fetching access requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRequests('pending');
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Approve request
  const approveRequest = async (requestId: string, notes?: string): Promise<boolean> => {
    if (!isAdmin || !user?.id) return false;

    setIsProcessing(requestId);

    try {
      // Get the request details
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        toast.error('Request not found');
        return false;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('user_approval_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || 'Approved'
        })
        .eq('id', requestId);

      if (updateError) {
        logger.error('Error updating request:', updateError);
        toast.error('Failed to approve request');
        return false;
      }

      // Assign the role to the user using the RPC function
      const { error: roleError } = await supabase
        .rpc('admin_assign_role', {
          p_user_id: request.user_id,
          p_role: request.role_requested,
          p_granted_by: user.id
        });

      if (roleError) {
        logger.error('Error assigning role:', roleError);
        toast.error('Request approved but role assignment failed. Please assign role manually.');
        return false;
      }

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          title: 'Access Request Approved',
          message: `Your ${request.role_requested === 'vendor' ? 'Vendor' : 'Property Manager'} access has been approved. Please refresh your browser to access new features.`,
          type: 'success',
          action_url: request.role_requested === 'vendor' ? '/vendor' : '/dashboard'
        });

      toast.success('Request approved and role assigned successfully');
      await fetchRequests('pending');
      return true;
    } catch (err) {
      logger.error('Exception approving request:', err);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsProcessing(null);
    }
  };

  // Reject request
  const rejectRequest = async (requestId: string, reason: string): Promise<boolean> => {
    if (!isAdmin || !user?.id) return false;

    setIsProcessing(requestId);

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        toast.error('Request not found');
        return false;
      }

      const { error } = await supabase
        .from('user_approval_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: reason
        })
        .eq('id', requestId);

      if (error) {
        logger.error('Error rejecting request:', error);
        toast.error('Failed to reject request');
        return false;
      }

      // Notify user
      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          title: 'Access Request Not Approved',
          message: reason || 'Your access request was not approved at this time.',
          type: 'warning',
          action_url: '/contact'
        });

      toast.success('Request rejected');
      await fetchRequests('pending');
      return true;
    } catch (err) {
      logger.error('Exception rejecting request:', err);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return {
    requests,
    isLoading,
    isProcessing,
    fetchRequests,
    approveRequest,
    rejectRequest,
    pendingCount,
    isAdmin
  };
}
