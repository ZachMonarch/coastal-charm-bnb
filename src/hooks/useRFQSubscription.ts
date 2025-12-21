import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

export function useRFQSubscription(rfqId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!rfqId) return;

    logger.debug(`Setting up real-time subscription for RFQ ${rfqId}`);

    const channel = supabase
      .channel(`rfq-${rfqId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfqs', filter: `id=eq.${rfqId}` },
        () => {
          logger.debug(`RFQ ${rfqId} changed, invalidating queries`);
          queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
          queryClient.invalidateQueries({ queryKey: ['rfqs'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bid_lines' },
        () => {
          logger.debug(`Bid lines changed for RFQ ${rfqId}`);
          queryClient.invalidateQueries({ queryKey: ['bids', rfqId] });
          queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfq_invites' },
        () => {
          logger.debug(`RFQ invites changed for RFQ ${rfqId}`);
          queryClient.invalidateQueries({ queryKey: ['rfq-invites', rfqId] });
          queryClient.invalidateQueries({ queryKey: ['rfq', rfqId] });
        }
      )
      .subscribe();

    return () => {
      logger.debug(`Cleaning up subscription for RFQ ${rfqId}`);
      supabase.removeChannel(channel);
    };
  }, [rfqId, queryClient]);
}

export function useRFQListSubscription() {
  const queryClient = useQueryClient();

  useEffect(() => {
    logger.debug('Setting up real-time subscription for RFQ list');

    const channel = supabase
      .channel('rfq-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfqs' },
        () => {
          logger.debug('RFQ list changed, invalidating queries');
          queryClient.invalidateQueries({ queryKey: ['rfqs'] });
          queryClient.invalidateQueries({ queryKey: ['admin-rfqs'] });
        }
      )
      .subscribe();

    return () => {
      logger.debug('Cleaning up RFQ list subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useVendorBidsSubscription(vendorId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!vendorId) return;

    logger.debug(`Setting up subscription for vendor ${vendorId} bids`);

    const channel = supabase
      .channel(`vendor-bids-${vendorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bid_lines', filter: `vendor_id=eq.${vendorId}` },
        () => {
          logger.debug(`Vendor ${vendorId} bids changed`);
          queryClient.invalidateQueries({ queryKey: ['vendor-bids', vendorId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfq_invites', filter: `vendor_id=eq.${vendorId}` },
        () => {
          logger.debug(`Vendor ${vendorId} invites changed`);
          queryClient.invalidateQueries({ queryKey: ['vendor-invites', vendorId] });
        }
      )
      .subscribe();

    return () => {
      logger.debug(`Cleaning up subscription for vendor ${vendorId}`);
      supabase.removeChannel(channel);
    };
  }, [vendorId, queryClient]);
}
