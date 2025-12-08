import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, FileText, TrendingUp, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Receipt } from 'lucide-react';
import { useVendorInvoicing } from '@/hooks/useVendorInvoicing';
import VendorInvoicesTable from '@/components/VendorInvoicesTable';
import VendorPayoutsTable from '@/components/VendorPayoutsTable';
import InvoiceGenerationSection from '@/components/InvoiceGenerationSection';
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import PageHero from '@/components/shared/PageHero';
import StatsCard from '@/components/shared/StatsCard';
import ColorfulIconBox from '@/components/shared/ColorfulIconBox';
import { Shimmer, ShimmerCard } from '@/components/ui/shimmer';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';

interface VendorPaymentFromAdmin {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  amount: number;
  payment_type: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

interface VendorPayoutSummary {
  pending: number;
  acknowledged: number;
  completed: number;
}

export default function VendorPayments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    invoices,
    payouts,
    completedMilestones,
    loading,
    generating,
    totals,
    generateInvoice,
    updateInvoiceStatus
  } = useVendorInvoicing();

  const [vendorPayments, setVendorPayments] = useState<VendorPaymentFromAdmin[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [payoutSummary, setPayoutSummary] = useState<VendorPayoutSummary>({ pending: 0, acknowledged: 0, completed: 0 });

  useEffect(() => {
    const fetchVendorPayments = async () => {
      if (!user?.id) return;
      
      setPaymentsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vendor_payments')
          .select('id, vendor_id, title, description, amount, payment_type, status, due_date, created_at')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setVendorPayments(data || []);

        const { data: payoutsData } = await supabase
          .from('vendor_payouts')
          .select('amount, status, vendor_acknowledged')
          .eq('vendor_id', user.id);

        if (payoutsData) {
          const summary = {
            pending: payoutsData.filter(p => p.status === 'pending' && !p.vendor_acknowledged).reduce((sum, p) => sum + p.amount, 0),
            acknowledged: payoutsData.filter(p => p.vendor_acknowledged && p.status !== 'completed').reduce((sum, p) => sum + p.amount, 0),
            completed: payoutsData.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
          };
          setPayoutSummary(summary);
        }
      } catch (error) {
        console.error('Error fetching vendor payments:', error);
        toast.error('Failed to load payments');
      } finally {
        setPaymentsLoading(false);
      }
    };
    
    fetchVendorPayments();
  }, [user?.id]);

  const handlePayment = async (paymentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { paymentId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to payment...');
      }
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    }
  };

  const pendingPayments = vendorPayments.filter(p => p.status === 'pending');
  const totalOwed = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = pendingPayments.filter(p => p.due_date && new Date(p.due_date) < new Date());

  if (loading || paymentsLoading) {
    return (
      <PrivatePageWrapper title="Payments & Invoicing">
        <div className="space-y-6 animate-fade-in">
          <div className="h-40 rounded-xl loading-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <ShimmerCard key={i} />
            ))}
          </div>
          <div className="h-64 rounded-xl loading-shimmer" />
        </div>
      </PrivatePageWrapper>
    );
  }

  return (
    <PrivatePageWrapper title="Payments & Invoicing">
      <EnhancedPageBackground gradient="linear" pattern="dots" primaryColor="success">
        <div className="space-y-8 animate-fade-in">
        {/* Enhanced Hero Section */}
        <PageHero
          title="Payments & Invoicing"
          description="Track your earnings, manage invoices, and view payment obligations"
          icon={Wallet}
          variant="gradient"
          stats={[
            { 
              label: 'Expected Earnings', 
              value: `$${(payoutSummary.pending + payoutSummary.acknowledged).toFixed(0)}`, 
              icon: TrendingUp, 
              color: 'success' 
            },
            { 
              label: 'Amount Due', 
              value: `$${totalOwed.toFixed(0)}`, 
              icon: CreditCard, 
              color: totalOwed > 0 ? 'warning' : 'success'
            },
            { 
              label: 'Paid Invoices', 
              value: `$${totals.totalPaid.toFixed(0)}`, 
              icon: Receipt, 
              color: 'info' 
            },
            { 
              label: 'Total Received', 
              value: `$${payoutSummary.completed.toFixed(0)}`, 
              icon: DollarSign, 
              color: 'primary' 
            },
          ]}
        />

        {/* Financial Overview with Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Expected Earnings"
            value={`$${(payoutSummary.pending + payoutSummary.acknowledged).toFixed(2)}`}
            subtitle="Pending payouts from admin"
            icon={TrendingUp}
            color="success"
            trend={{ value: 12.5, isPositive: true }}
          />

          <StatsCard
            title="Amount Due"
            value={`$${totalOwed.toFixed(2)}`}
            subtitle={`${pendingPayments.length} pending payment(s)`}
            icon={Wallet}
            color={totalOwed > 0 ? 'warning' : 'success'}
          />

          <StatsCard
            title="Paid Invoices"
            value={`$${totals.totalPaid.toFixed(2)}`}
            subtitle="From your invoices"
            icon={DollarSign}
            color="info"
          />

          <StatsCard
            title="Total Received"
            value={`$${payoutSummary.completed.toFixed(2)}`}
            subtitle="Completed payouts"
            icon={FileText}
            color="primary"
          />
        </div>

        {/* Overdue Alert with Enhanced Styling */}
        {overduePayments.length > 0 && (
          <Card className="border-2 border-destructive/30 bg-gradient-to-r from-destructive/10 via-background to-destructive/5 shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <ColorfulIconBox icon={AlertTriangle} color="error" size="lg" glow />
                <div className="flex-1">
                  <p className="font-semibold text-destructive text-lg">
                    {overduePayments.length} Overdue Payment{overduePayments.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total overdue: <span className="font-bold text-destructive">${overduePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="lg" 
                  className="shadow-lg shadow-destructive/25"
                  onClick={() => {
                    const firstOverdue = overduePayments[0];
                    if (firstOverdue) handlePayment(firstOverdue.id);
                  }}
                >
                  Pay Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Payments from Admin with Enhanced Table Rows */}
        {pendingPayments.length > 0 && (
          <Card variant="gradient" className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ColorfulIconBox icon={DollarSign} color="primary" size="md" />
                <span>Payments Due</span>
                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-primary/20">
                  {pendingPayments.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Background checks, subscription fees, and other vendor payments required
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingPayments.map((payment) => {
                  const isOverdue = payment.due_date && new Date(payment.due_date) < new Date();
                  return (
                    <div 
                      key={payment.id} 
                      className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 table-row-glow ${
                        isOverdue 
                          ? 'table-row-error' 
                          : 'hover:bg-muted/50 hover:border-primary/30'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{payment.title}</h4>
                          <StatusBadge status={payment.status} />
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs badge-glow-error">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{payment.description}</p>
                        {payment.due_date && (
                          <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            <Clock className="h-3 w-3" />
                            Due: {new Date(payment.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xl font-bold ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                          ${payment.amount.toFixed(2)}
                        </span>
                        <Button 
                          onClick={() => handlePayment(payment.id)} 
                          variant={isOverdue ? 'destructive' : 'default'}
                          className={isOverdue ? 'shadow-lg shadow-destructive/25' : 'shadow-md'}
                        >
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expected Earnings Quick View with Enhanced Styling */}
        {(payoutSummary.pending > 0 || payoutSummary.acknowledged > 0) && (
          <Card variant="success" className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                  <ColorfulIconBox icon={TrendingUp} color="success" size="md" glow />
                  Expected Earnings
                </span>
                <Button variant="outline" size="sm" onClick={() => navigate('/vendor/payouts')}>
                  View All Payouts
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card-warning p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <ColorfulIconBox icon={Clock} color="warning" size="sm" />
                    <p className="text-sm text-muted-foreground">Awaiting Acknowledgment</p>
                  </div>
                  <p className="text-2xl font-bold text-warning">${payoutSummary.pending.toFixed(2)}</p>
                </div>
                <div className="stat-card-success p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <ColorfulIconBox icon={DollarSign} color="success" size="sm" />
                    <p className="text-sm text-muted-foreground">Ready for Withdrawal</p>
                  </div>
                  <p className="text-2xl font-bold text-success">${payoutSummary.acknowledged.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoice Generation Section */}
        {completedMilestones.length > 0 && (
          <InvoiceGenerationSection
            completedMilestones={completedMilestones}
            loading={loading}
            generating={generating}
            onGenerateInvoice={generateInvoice}
          />
        )}

        {/* Invoices Table */}
        <VendorInvoicesTable
          invoices={invoices}
          loading={loading}
          onUpdateStatus={updateInvoiceStatus}
        />

        {/* Payouts Table */}
        <VendorPayoutsTable
          payouts={payouts}
          loading={loading}
        />
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
