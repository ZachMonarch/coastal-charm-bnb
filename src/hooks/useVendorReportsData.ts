import { useState, useEffect, useMemo } from 'react';
import { useVendorRFQs } from './useVendorRFQs';
import { useVendorInvoicing } from './useVendorInvoicing';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface RFQWinRateData {
  totalBids: number;
  wonBids: number;
  lostBids: number;
  pendingBids: number;
  winRate: number;
  chartData: Array<{ name: string; value: number; color: string }>;
}

interface MilestonePerformanceData {
  totalMilestones: number;
  onTimeMilestones: number;
  lateMilestones: number;
  onTimeRate: number;
}

interface MonthlyFinancialData {
  invoiced: {
    total: number;
    paid: number;
    pending: number;
  };
  payouts: {
    total: number;
    completed: number;
    pending: number;
  };
  chartData: Array<{ category: string; invoiced: number; paid: number; payouts: number }>;
}

export function useVendorReportsData() {
  const { user } = useAuth();
  const { myBids, loading: rfqLoading } = useVendorRFQs();
  const { invoices, payouts, loading: invoiceLoading } = useVendorInvoicing();

  // Fetch milestone performance data with caching
  const { data: milestoneData, isLoading: milestoneLoading } = useQuery({
    queryKey: ['vendor-milestone-performance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // First get projects assigned to this vendor
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('assigned_vendor_id', user.id);

      if (projectsError) throw projectsError;
      
      if (!projects || projects.length === 0) {
        return {
          totalMilestones: 0,
          onTimeMilestones: 0,
          lateMilestones: 0,
          onTimeRate: 0,
          isEmpty: true,
        };
      }

      const projectIds = projects.map(p => p.id);

      // Then get milestones for those projects
      const { data: milestones, error } = await supabase
        .from('project_milestones')
        .select('id, completion_date, due_date, status, project_id')
        .in('project_id', projectIds);

      if (error) throw error;

      if (!milestones || milestones.length === 0) {
        return {
          totalMilestones: 0,
          onTimeMilestones: 0,
          lateMilestones: 0,
          onTimeRate: 0,
          isEmpty: true,
        };
      }

      const completedMilestones = milestones.filter(m => m.status === 'completed');
      const onTimeMilestones = completedMilestones.filter(m => 
        m.completion_date && m.due_date &&
        new Date(m.completion_date) <= new Date(m.due_date)
      ).length;

      const totalCompleted = completedMilestones.length;
      const lateMilestones = totalCompleted - onTimeMilestones;
      const onTimeRate = totalCompleted > 0 ? (onTimeMilestones / totalCompleted) * 100 : 0;

      return {
        totalMilestones: milestones.length,
        onTimeMilestones,
        lateMilestones,
        onTimeRate,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Calculate RFQ Win Rate from real bid data
  const rfqWinRate = useMemo((): RFQWinRateData & { isEmpty?: boolean } => {
    if (!myBids || myBids.length === 0) {
      return {
        totalBids: 0,
        wonBids: 0,
        lostBids: 0,
        pendingBids: 0,
        winRate: 0,
        chartData: [],
        isEmpty: true,
      };
    }

    const totalBids = myBids.length;
    const wonBids = myBids.filter(bid => bid.status === 'awarded').length;
    const lostBids = myBids.filter(bid => bid.status === 'rejected').length;
    const pendingBids = myBids.filter(bid => 
      bid.status === 'submitted' || bid.status === 'under_review'
    ).length;
    const winRate = totalBids > 0 ? (wonBids / totalBids) * 100 : 0;

    return {
      totalBids,
      wonBids,
      lostBids,
      pendingBids,
      winRate,
      chartData: [
        { name: 'Won', value: wonBids, color: 'hsl(var(--chart-1))' },
        { name: 'Lost', value: lostBids, color: 'hsl(var(--chart-2))' },
        { name: 'Pending', value: pendingBids, color: 'hsl(var(--chart-3))' },
      ].filter(item => item.value > 0),
    };
  }, [myBids]);

  // Calculate monthly financial data from real invoices and payouts
  const monthlyFinancials = useMemo((): MonthlyFinancialData & { isEmpty?: boolean } => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (!invoices || invoices.length === 0) {
      return {
        invoiced: { total: 0, paid: 0, pending: 0 },
        payouts: { total: 0, completed: 0, pending: 0 },
        chartData: [],
        isEmpty: true,
      };
    }

    const monthlyInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.created_at);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });

    const monthlyPayouts = payouts?.filter(payout => {
      const payoutDate = new Date(payout.created_at);
      return payoutDate.getMonth() === currentMonth && payoutDate.getFullYear() === currentYear;
    }) || [];

    const invoicedTotal = monthlyInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const invoicedPaid = monthlyInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const invoicedPending = monthlyInvoices
      .filter(i => i.status === 'sent' || i.status === 'draft' || i.status === 'pending')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const payoutsTotal = monthlyPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const payoutsCompleted = monthlyPayouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const payoutsPending = monthlyPayouts
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      invoiced: {
        total: invoicedTotal,
        paid: invoicedPaid,
        pending: invoicedPending,
      },
      payouts: {
        total: payoutsTotal,
        completed: payoutsCompleted,
        pending: payoutsPending,
      },
      chartData: [
        { 
          category: 'Invoiced', 
          invoiced: invoicedTotal, 
          paid: invoicedPaid, 
          payouts: 0 
        },
        { 
          category: 'Payouts', 
          invoiced: 0, 
          paid: 0, 
          payouts: payoutsCompleted 
        },
      ],
    };
  }, [invoices, payouts]);

  const loading = rfqLoading || invoiceLoading || milestoneLoading;

  return {
    rfqWinRate,
    milestonePerformance: milestoneData || {
      totalMilestones: 0,
      onTimeMilestones: 0,
      lateMilestones: 0,
      onTimeRate: 0,
      isEmpty: true,
    },
    monthlyFinancials,
    loading,
  };
}
