import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScoringWeights {
  rfq_id: string;
  price_weight: number;
  delivery_weight: number;
  compliance_weight: number;
  experience_weight: number;
  quality_weight: number;
}

export const DEFAULT_WEIGHTS: Omit<ScoringWeights, 'rfq_id'> = {
  price_weight: 40, delivery_weight: 20, compliance_weight: 15, experience_weight: 15, quality_weight: 10,
};

export function useScoringWeights(rfqId?: string) {
  return useQuery({
    queryKey: ['scoring-weights', rfqId],
    queryFn: async () => {
      if (!rfqId) return null;
      const { data, error } = await supabase
        .from('rfq_scoring_weights')
        .select('*')
        .eq('rfq_id', rfqId)
        .maybeSingle();
      if (error) throw error;
      return (data as ScoringWeights) ?? { rfq_id: rfqId, ...DEFAULT_WEIGHTS };
    },
    enabled: !!rfqId,
  });
}

export function useSaveScoringWeights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (w: ScoringWeights) => {
      const { data, error } = await supabase
        .from('rfq_scoring_weights')
        .upsert({ ...w, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d: any) => { toast.success('Scoring weights saved'); qc.invalidateQueries({ queryKey: ['scoring-weights', d.rfq_id] }); },
    onError: (e: any) => toast.error(e.message || 'Save failed'),
  });
}

export function useBidScore(bidId?: string) {
  return useQuery({
    queryKey: ['bid-score', bidId],
    queryFn: async () => {
      if (!bidId) return null;
      const { data, error } = await supabase.rpc('compute_bid_score', { _bid_id: bidId });
      if (error) throw error;
      return Number(data) || 0;
    },
    enabled: !!bidId,
  });
}
