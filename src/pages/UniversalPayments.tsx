import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DollarSign, CreditCard, AlertCircle } from 'lucide-react';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Payment {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  payment_type: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
}

export default function UniversalPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    if (user) {
      fetchPayments();

      // Real-time subscription
      const channel = supabase
        .channel('user-payments')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'vendor_payments',
          filter: `vendor_id=eq.${user.id}`
        }, fetchPayments)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('id, title, description, amount, status, payment_type, due_date, paid_at, created_at')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowPayDialog(true);
  };

  const processPayment = async () => {
    if (!selectedPayment) return;

    try {
      // Call Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { paymentId: selectedPayment.id }
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

  const handleRequestRefund = async () => {
    if (!selectedPayment || !refundReason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_refunds')
        .insert({
          payment_id: selectedPayment.id,
          requested_by: user?.id,
          reason: refundReason,
          amount: selectedPayment.amount,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Refund request submitted');
      setShowRefundDialog(false);
      setRefundReason('');
      setSelectedPayment(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to request refund');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
      paid: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
      overdue: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
      cancelled: 'bg-muted text-muted-foreground border-border',
      refunded: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40'
    };
    return variants[status] || variants.pending;
  };

  const isOverdue = (payment: Payment) => {
    if (payment.status !== 'pending' || !payment.due_date) return false;
    return new Date(payment.due_date) < new Date();
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => ['paid', 'refunded'].includes(p.status));
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <PrivatePageWrapper title="My Payments">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PrivatePageWrapper>
    );
  }

  return (
    <PrivatePageWrapper title="My Payments">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">My Payments</h1>
          <p className="text-muted-foreground">
            View and manage your payment requests
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">${totalPending.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold">{pendingPayments.filter(isOverdue).length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
            <TabsTrigger value="history">Payment History ({paidPayments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingPayments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No pending payments</p>
                  </CardContent>
                </Card>
              ) : (
                pendingPayments.map((payment) => (
                  <Card key={payment.id} className={isOverdue(payment) ? 'border-destructive' : ''}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{payment.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{payment.description}</p>
                        </div>
                        <Badge className={getStatusBadge(payment.status)}>
                          {isOverdue(payment) ? 'Overdue' : 'Pending'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">${payment.amount.toFixed(2)}</p>
                          {payment.due_date && (
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(payment.due_date).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground capitalize">
                            {payment.payment_type.replace('_', ' ')}
                          </p>
                        </div>
                        <Button onClick={() => handlePayNow(payment)}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              {paidPayments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No payment history yet</p>
                  </CardContent>
                </Card>
              ) : (
                paidPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{payment.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{payment.description}</p>
                        </div>
                        <Badge className={getStatusBadge(payment.status)}>{payment.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">${payment.amount.toFixed(2)}</p>
                          {payment.paid_at && (
                            <p className="text-sm text-muted-foreground">
                              Paid: {new Date(payment.paid_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {payment.status === 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowRefundDialog(true);
                            }}
                          >
                            Request Refund
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Payment For</Label>
                  <p className="font-medium">{selectedPayment.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-2xl font-bold">${selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to Stripe to complete this payment securely.
                  </p>
                </div>
                <Button className="w-full" onClick={processPayment}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with Stripe
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Refund Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Refund</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Payment</Label>
                  <p className="font-medium">{selectedPayment.title}</p>
                  <p className="text-lg font-bold">${selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label>Reason for Refund</Label>
                  <Textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Please explain why you're requesting a refund..."
                    rows={4}
                  />
                </div>
                <Button className="w-full" onClick={handleRequestRefund}>
                  Submit Refund Request
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PrivatePageWrapper>
  );
}
