import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';

export interface VendorInvoice {
  id: string;
  invoice_number: string;
  milestone_id?: string;
  project_id?: string;
  vendor_id: string;
  amount: number;
  status: string;
  due_date?: string;
  created_at: string;
  line_items: any[];
  client_name: string;
  client_email: string;
  description?: string;
  invoice_type: string;
  project?: {
    title: string;
    id: string;
  };
  milestone?: {
    name: string;
    id: string;
  };
}

export interface VendorPayout {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  reference?: string;
  transaction_id?: string;
  payout_date?: string;
  created_at: string;
  metadata: any;
}

export interface CompletedMilestone {
  id: string;
  name: string;
  project_id: string;
  amount: number;
  completion_date: string;
  has_invoice: boolean;
  project: {
    title: string;
    created_by: string;
  };
}

export function useVendorInvoicing() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [completedMilestones, setCompletedMilestones] = useState<CompletedMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await Promise.all([
        fetchInvoices(),
        fetchPayouts(),
        fetchCompletedMilestones()
      ]);
    } catch (error) {
      console.error('Error fetching invoicing data:', error);
      toast.error('Failed to load invoicing data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        project:projects(title, id),
        milestone:project_milestones(name, id)
      `)
      .eq('vendor_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match our interface
    const transformedInvoices = (data || []).map(invoice => ({
      ...invoice,
      line_items: Array.isArray(invoice.line_items) ? invoice.line_items : []
    }));
    
    setInvoices(transformedInvoices as VendorInvoice[]);
  };

  const fetchPayouts = async () => {
    const { data, error } = await supabase
      .from('vendor_payouts')
      .select('id, vendor_id, amount, status, reference, transaction_id, payout_date, created_at, metadata')
      .eq('vendor_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    setPayouts(data || []);
  };

  const fetchCompletedMilestones = async () => {
    // Get completed milestones for projects assigned to this vendor
    const { data: milestonesData, error: milestonesError } = await supabase
      .from('project_milestones')
      .select(`
        *,
        project:projects!inner(title, created_by, assigned_vendor_id)
      `)
      .eq('status', 'completed')
      .eq('project.assigned_vendor_id', user!.id);

    if (milestonesError) throw milestonesError;

    // Get existing invoices for these milestones
    const { data: existingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('milestone_id')
      .eq('vendor_id', user!.id)
      .not('milestone_id', 'is', null);

    if (invoicesError) throw invoicesError;

    const invoicedMilestoneIds = new Set(existingInvoices.map(inv => inv.milestone_id));

    const enrichedMilestones = (milestonesData || []).map(milestone => ({
      ...milestone,
      has_invoice: invoicedMilestoneIds.has(milestone.id)
    }));

    setCompletedMilestones(enrichedMilestones);
  };

  const generateInvoice = async (milestone: CompletedMilestone) => {
    if (!user) return;

    setGenerating(true);
    try {
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${milestone.id.slice(0, 8)}`;
      
      // Get project creator details for client info
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', milestone.project.created_by)
        .single();

      const invoiceData = {
        invoice_number: invoiceNumber,
        milestone_id: milestone.id,
        project_id: milestone.project_id,
        vendor_id: user.id,
        created_by: user.id,
        amount: milestone.amount,
        status: 'draft',
        client_name: clientProfile?.full_name || 'Client',
        client_email: clientProfile?.email || '',
        description: `Invoice for milestone: ${milestone.name}`,
        invoice_type: 'milestone',
        currency: 'USD',
        line_items: [{
          description: milestone.name,
          quantity: 1,
          unit_price: milestone.amount,
          total: milestone.amount
        }],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };

      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Invoice generated successfully');
      await fetchAllData(); // Refresh all data
      return data;
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId);

      if (error) throw error;
      
      toast.success('Invoice status updated');
      await fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const totals = {
    totalInvoiced: invoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
    totalPaid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0),
    totalPending: invoices.filter(inv => inv.status === 'draft' || inv.status === 'sent').reduce((sum, inv) => sum + Number(inv.amount), 0),
    totalPayouts: payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0),
    pendingPayouts: payouts.filter(p => p.status === 'pending' || p.status === 'processing').reduce((sum, p) => sum + Number(p.amount), 0)
  };

  return {
    invoices,
    payouts,
    completedMilestones: completedMilestones.filter(m => !m.has_invoice),
    loading,
    generating,
    totals,
    generateInvoice,
    updateInvoiceStatus,
    refetch: fetchAllData
  };
}