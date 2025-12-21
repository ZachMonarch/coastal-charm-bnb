import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export type RoleRequestType = 'vendor' | 'property_manager';

export interface AccessRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role_requested: RoleRequestType;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface AccessRequestFormData {
  role_requested: RoleRequestType;
  company_name?: string;
  phone?: string;
  full_name?: string;
}

export function useAccessRequest() {
  const { user, isAuthenticated } = useAuth();
  const [existingRequest, setExistingRequest] = useState<AccessRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already has a pending request
  const fetchExistingRequest = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_approval_requests')
        .select('id, user_id, email, full_name, role_requested, status, admin_notes, reviewed_by, company_name, phone, created_at, reviewed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching access request:', error);
      } else {
        setExistingRequest(data as AccessRequest | null);
      }
    } catch (err) {
      logger.error('Exception fetching access request:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExistingRequest();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchExistingRequest]);

  // Submit a new access request
  const submitRequest = async (formData: AccessRequestFormData): Promise<boolean> => {
    if (!user?.id || !user?.email) {
      toast.error('You must be logged in to submit a request');
      return false;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_approval_requests')
        .insert({
          user_id: user.id,
          email: user.email.toLowerCase(),
          full_name: formData.full_name || user.user_metadata?.full_name || null,
          role_requested: formData.role_requested,
          company_name: formData.company_name || null,
          phone: formData.phone || null,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already have a pending request');
        } else {
          logger.error('Error submitting access request:', error);
          toast.error('Failed to submit request. Please try again.');
        }
        return false;
      }

      toast.success('Access request submitted successfully! An admin will review your request.');
      await fetchExistingRequest();
      return true;
    } catch (err) {
      logger.error('Exception submitting access request:', err);
      toast.error('An unexpected error occurred');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has limited access (authenticated but no approved role)
  const hasLimitedAccess = useCallback((): boolean => {
    if (!isAuthenticated || !user) return false;
    
    // If user has a role other than authenticated, they have full access
    const userRole = user.user_metadata?.role || user.role;
    if (userRole && ['admin', 'vendor', 'property_manager'].includes(userRole)) {
      return false;
    }

    return true;
  }, [isAuthenticated, user]);

  // Check if user has a pending request
  const hasPendingRequest = existingRequest?.status === 'pending';
  const hasApprovedRequest = existingRequest?.status === 'approved';
  const hasRejectedRequest = existingRequest?.status === 'rejected';

  return {
    existingRequest,
    isLoading,
    isSubmitting,
    submitRequest,
    fetchExistingRequest,
    hasLimitedAccess,
    hasPendingRequest,
    hasApprovedRequest,
    hasRejectedRequest
  };
}
