import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useEMD(rfqId?: string, vendorId?: string) {
  return useQuery({
    queryKey: ['emd', rfqId, vendorId],
    queryFn: async () => {
      if (!rfqId || !vendorId) return null;
      const { data, error } = await supabase
        .from('emd_transactions')
        .select('id, status, amount_cents, currency, paid_at, released_at, forfeited_at')
        .eq('rfq_id', rfqId)
        .eq('vendor_id', vendorId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!rfqId && !!vendorId,
  });
}

export function useStartEMDPayment() {
  return useMutation({
    mutationFn: async (rfq_id: string) => {
      const { data, error } = await supabase.functions.invoke('create-emd-payment', { body: { rfq_id } });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.url) window.location.href = data.url;
      else if (data?.already_held) toast.success('EMD already paid');
    },
    onError: (e: any) => toast.error(e.message || 'Failed to start EMD payment'),
  });
}

export function useAdminEMDList() {
  return useQuery({
    queryKey: ['emd-admin-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emd_transactions')
        .select('id, rfq_id, vendor_id, amount_cents, currency, status, paid_at, released_at, forfeited_at, notes, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRefundEMD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ emd_id, notes }: { emd_id: string; notes?: string }) => {
      const { data, error } = await supabase.functions.invoke('refund-emd', { body: { emd_id, notes } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('EMD refunded'); qc.invalidateQueries({ queryKey: ['emd-admin-list'] }); },
    onError: (e: any) => toast.error(e.message || 'Refund failed'),
  });
}

export function useForfeitEMD() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ emd_id, notes }: { emd_id: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('forfeit_emd', { _emd_id: emd_id, _notes: notes ?? null });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success('EMD forfeited'); qc.invalidateQueries({ queryKey: ['emd-admin-list'] }); },
    onError: (e: any) => toast.error(e.message || 'Forfeit failed'),
  });
}
