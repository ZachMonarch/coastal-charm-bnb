import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';

export interface RFQAccessRequest {
  id: string;
  rfq_id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  message: string | null;
  rfi_answers: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface RFQAccessGrant {
  id: string;
  rfq_id: string;
  user_id: string;
  granted_at: string;
  revoked_at: string | null;
}

interface RFQAccessFormData {
  company_name: string;
  phone: string;
  full_name?: string;
  message: string;
  qualifications?: string;
  services_interest?: string[];
}

/**
 * Per-RFQ access state for the current user.
 * Returns whether the user can view the full RFQ, has a pending request, etc.
 */
export function useRFQAccess(rfqId: string | undefined) {
  const { user, isAuthenticated } = useAuth();
  const [request, setRequest] = useState<RFQAccessRequest | null>(null);
  const [grant, setGrant] = useState<RFQAccessGrant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!rfqId || !user?.id) {
      setRequest(null);
      setGrant(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [reqRes, grantRes] = await Promise.all([
        supabase
          .from('rfq_access_requests')
          .select('id,rfq_id,user_id,email,full_name,company_name,phone,message,rfi_answers,status,admin_notes,reviewed_by,reviewed_at,created_at')
          .eq('rfq_id', rfqId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('rfq_access_grants')
          .select('id,rfq_id,user_id,granted_at,revoked_at')
          .eq('rfq_id', rfqId)
          .eq('user_id', user.id)
          .is('revoked_at', null)
          .maybeSingle(),
      ]);
      setRequest((reqRes.data ?? null) as RFQAccessRequest | null);
      setGrant((grantRes.data ?? null) as RFQAccessGrant | null);
    } finally {
      setIsLoading(false);
    }
  }, [rfqId, user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitRequest = async (data: RFQAccessFormData): Promise<boolean> => {
    if (!user?.id || !user?.email || !rfqId) {
      toast.error('You must be signed in to request access.');
      return false;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('rfq_access_requests')
        .upsert(
          {
            rfq_id: rfqId,
            user_id: user.id,
            email: user.email,
            full_name: data.full_name ?? null,
            company_name: data.company_name,
            phone: data.phone,
            message: data.message,
            rfi_answers: {
              qualifications: data.qualifications ?? '',
              services_interest: data.services_interest ?? [],
            },
            status: 'pending',
          },
          { onConflict: 'rfq_id,user_id' }
        );
      if (error) {
        toast.error(`Could not submit access request: ${error.message}`);
        return false;
      }
      toast.success('Access request submitted. The admin will review it shortly.');
      await refresh();
      return true;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    request,
    grant,
    hasAccess: Boolean(grant && !grant.revoked_at),
    isPending: request?.status === 'pending',
    isRejected: request?.status === 'rejected',
    isLoading,
    isSubmitting,
    isAuthenticated,
    submitRequest,
    refresh,
  };
}
