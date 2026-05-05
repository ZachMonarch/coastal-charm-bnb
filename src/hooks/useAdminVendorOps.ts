import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useTopVendors(limit = 10) {
  return useQuery({
    queryKey: ['top-vendors', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_vendors', { _limit: limit });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCrossRFQBids(status?: string) {
  return useQuery({
    queryKey: ['cross-rfq-bids', status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cross_rfq_bids', { _status: status ?? null });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useToggleShortlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rfq_id, vendor_id, shortlisted }: { rfq_id: string; vendor_id: string; shortlisted: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error('Not authenticated');
      if (shortlisted) {
        const { error } = await supabase.from('bid_shortlist').delete().eq('rfq_id', rfq_id).eq('vendor_id', vendor_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bid_shortlist').insert({ rfq_id, vendor_id, shortlisted_by: uid });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success('Shortlist updated'); qc.invalidateQueries({ queryKey: ['cross-rfq-bids'] }); },
    onError: (e: any) => toast.error(e.message || 'Update failed'),
  });
}

export function useAdminVendorDetail(vendorId?: string) {
  return useQuery({
    queryKey: ['admin-vendor-detail', vendorId],
    queryFn: async () => {
      if (!vendorId) return null;
      const { data, error } = await supabase.rpc('get_admin_vendor_detail', { _vendor_id: vendorId });
      if (error) throw error;
      return data;
    },
    enabled: !!vendorId,
  });
}

export function useToggleBlacklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vendor_user_id, blacklist, reason }: { vendor_user_id: string; blacklist: boolean; reason?: string }) => {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({
          is_blacklisted: blacklist,
          blacklist_reason: blacklist ? (reason || null) : null,
          blacklisted_at: blacklist ? new Date().toISOString() : null,
        })
        .eq('user_id', vendor_user_id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.blacklist ? 'Vendor blacklisted' : 'Vendor unblacklisted');
      qc.invalidateQueries({ queryKey: ['vendors'] });
      qc.invalidateQueries({ queryKey: ['admin-vendor-detail'] });
    },
    onError: (e: any) => toast.error(e.message || 'Update failed'),
  });
}
