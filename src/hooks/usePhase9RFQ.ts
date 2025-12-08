import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface CreateRFQParams {
  property_id: number;
  title: string;
  description: string;
  deadline: string;
  lots: Array<{
    title: string;
    description: string;
    quantity: number;
    unit: string;
  }>;
}

interface InviteVendorsParams {
  rfq_id: string;
  vendor_ids: string[];
}

interface SubmitBidParams {
  rfq_id: string;
  bid_lines: Array<{
    rfq_lot_id: string;
    unit_price: number;
    notes?: string;
  }>;
  notes?: string;
}

interface AwardContractParams {
  rfq_id: string;
  vendor_id: string;
  contract_value: number;
  start_date: string;
  end_date: string;
}

export const usePhase9RFQ = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createRFQ = async (params: CreateRFQParams) => {
    try {
      const { data, error } = await supabase.rpc('create_rfq', {
        p_property_id: params.property_id,
        p_title: params.title,
        p_description: params.description,
        p_deadline: params.deadline,
        p_lots: params.lots as any
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success('RFQ created successfully');
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to create RFQ: ' + message);
      throw error;
    }
  };

  const inviteVendors = async (params: InviteVendorsParams) => {
    try {
      const { data, error } = await supabase.rpc('invite_vendors_to_rfq', {
        p_rfq_id: params.rfq_id,
        p_vendor_ids: params.vendor_ids as any
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfq-invites'] });
      toast.success(`${params.vendor_ids.length} vendors invited`);
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to invite vendors: ' + message);
      throw error;
    }
  };

  const submitBid = async (params: SubmitBidParams) => {
    try {
      const { data, error } = await supabase.rpc('submit_bid', {
        p_rfq_id: params.rfq_id,
        p_vendor_id: user?.id || '',
        p_bid_lines: params.bid_lines as any,
        p_notes: params.notes || null
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bids'] });
      queryClient.invalidateQueries({ queryKey: ['rfq-invites'] });
      
      // Send bid confirmation email
      try {
        const { data: rfqData } = await supabase
          .from('rfqs')
          .select('title')
          .eq('id', params.rfq_id)
          .single();
        
        const totalAmount = params.bid_lines.reduce((sum, line) => sum + line.unit_price, 0);
        
        await supabase.functions.invoke('send-bid-confirmation', {
          body: {
            rfqId: params.rfq_id,
            rfqTitle: rfqData?.title || 'RFQ',
            vendorId: user?.id,
            bidAmount: totalAmount
          }
        });
      } catch (emailError) {
        console.error('Failed to send bid confirmation email:', emailError);
      }
      
      toast.success('Bid submitted successfully');
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to submit bid: ' + message);
      throw error;
    }
  };

  const awardContract = async (params: AwardContractParams) => {
    try {
      const { data, error } = await supabase.rpc('award_contract', {
        p_rfq_id: params.rfq_id,
        p_vendor_id: params.vendor_id,
        p_contract_value: params.contract_value,
        p_start_date: params.start_date,
        p_end_date: params.end_date
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['rfq-invites'] });
      
      // Send contract award email
      try {
        const { data: rfqData } = await supabase
          .from('rfqs')
          .select('title')
          .eq('id', params.rfq_id)
          .single();
        
        await supabase.functions.invoke('send-contract-award', {
          body: {
            rfqId: params.rfq_id,
            rfqTitle: rfqData?.title || 'RFQ',
            vendorId: params.vendor_id,
            contractValue: params.contract_value,
            startDate: params.start_date,
            endDate: params.end_date
          }
        });
      } catch (emailError) {
        console.error('Failed to send contract award email:', emailError);
      }
      
      toast.success('Contract awarded successfully');
      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to award contract: ' + message);
      throw error;
    }
  };

  return {
    createRFQ,
    inviteVendors,
    submitBid,
    awardContract
  };
};