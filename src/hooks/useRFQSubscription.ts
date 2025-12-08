import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRFQSubscription(rfqId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!rfqId) return;

    console.log(`Setting up real-time subscription for RFQ ${rfqId}`);

    const channel = supabase
      .channel(`rfq-${rfqId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfqs', filter: `id=eq.${rfqId}` },
        (payload) => {
          console.log('RFQ changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
          queryClient.invalidateQueries({ queryKey: ['rfqs'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bid_lines' },
        (payload) => {
          console.log('Bid line changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['bids', rfqId] });
          queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfq_invites' },
        (payload) => {
          console.log('RFQ invite changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['rfq-invites', rfqId] });
          queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
        }
      )
      .subscribe();

    return () => {
      console.log(`Cleaning up real-time subscription for RFQ ${rfqId}`);
      supabase.removeChannel(channel);
    };
  }, [rfqId, queryClient]);
}

export function useRFQListSubscription() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up real-time subscription for RFQ list');

    const channel = supabase
      .channel('rfq-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfqs' },
        (payload) => {
          console.log('RFQ list changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['rfqs'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for RFQ list');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useVendorBidsSubscription(vendorId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!vendorId) return;

    console.log(`Setting up real-time subscription for vendor ${vendorId} bids`);

    const channel = supabase
      .channel(`vendor-bids-${vendorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bid_lines', filter: `vendor_id=eq.${vendorId}` },
        (payload) => {
          console.log('Vendor bid changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['vendor-bids', vendorId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfq_invites', filter: `vendor_id=eq.${vendorId}` },
        (payload) => {
          console.log('Vendor invite changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['vendor-invites', vendorId] });
        }
      )
      .subscribe();

    return () => {
      console.log(`Cleaning up real-time subscription for vendor ${vendorId}`);
      supabase.removeChannel(channel);
    };
  }, [vendorId, queryClient]);
}
