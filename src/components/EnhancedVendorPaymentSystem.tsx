import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Eye, DollarSign, Calendar, AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VendorPayment {
  id: string;
  title: string;
  description: string;
  amount: number;
  payment_type: string;
  status: string;
  due_date: string;
  created_at: string;
  stripe_session_id?: string;
}

export default function EnhancedVendorPaymentSystem() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<VendorPayment | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('id, vendor_id, title, description, amount, payment_type, status, due_date, created_at, created_by, paid_at, stripe_session_id')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      logger.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (payment: VendorPayment) => {
    if (!user) return;

    setProcessingPayment(payment.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-vendor-checkout', {
        body: {
          type: 'payment',
          amount: payment.amount,
          description: payment.title,
          payment_id: payment.id,
          metadata: {
            payment_type: payment.payment_type,
            vendor_id: user.id
          }
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to payment...');
      }
    } catch (error) {
      logger.error('Error creating payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/30';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'overdue':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'processing':
        return 'bg-info/10 text-info border-info/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'overdue':
        return AlertTriangle;
      case 'processing':
        return Clock;
      default:
        return Clock;
    }
  };

  const filteredPayments = payments.filter(payment => 
    filterStatus === 'all' || payment.status === filterStatus
  );

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Payment Center</h1>
        <p className="text-muted-foreground">
          Manage your vendor payments and subscription
        </p>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Pending Payments</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold">${totalPaid.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total Paid</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-info mx-auto mb-2" />
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-sm text-muted-foreground">Total Payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center space-x-4">
        <Label htmlFor="status-filter">Filter by Status:</Label>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Payments Found</h3>
              <p className="text-muted-foreground">
                {filterStatus === 'all' 
                  ? 'You have no payment records yet.'
                  : `No payments with status "${filterStatus}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => {
            const StatusIcon = getStatusIcon(payment.status);
            const isDue = new Date(payment.due_date) < new Date() && payment.status === 'pending';
            
            return (
              <Card key={payment.id} className="glass-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">{payment.title}</h3>
                            <Badge className={getStatusColor(payment.status)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {payment.status}
                            </Badge>
                            {isDue && (
                              <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-3">{payment.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <Label className="text-muted-foreground">Amount</Label>
                              <p className="font-medium text-lg">${Number(payment.amount).toFixed(2)}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Type</Label>
                              <p className="font-medium capitalize">{payment.payment_type.replace('_', ' ')}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Due Date</Label>
                              <p className="font-medium">
                                {new Date(payment.due_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Created</Label>
                              <p className="font-medium">
                                {new Date(payment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedPayment(payment)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                      
                      {payment.status === 'pending' && (
                        <Button
                          onClick={() => handlePayment(payment)}
                          disabled={processingPayment === payment.id}
                          className="btn-primary"
                          size="sm"
                        >
                          {processingPayment === payment.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay Now
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="mt-1">{selectedPayment.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="mt-1 text-2xl font-bold">${Number(selectedPayment.amount).toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedPayment.status)}>
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Type</Label>
                  <p className="mt-1 capitalize">{selectedPayment.payment_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Due Date</Label>
                  <p className="mt-1">{new Date(selectedPayment.due_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="mt-1">{new Date(selectedPayment.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="mt-1 text-muted-foreground">{selectedPayment.description}</p>
              </div>
              
              {selectedPayment.status === 'pending' && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => handlePayment(selectedPayment)}
                    disabled={processingPayment === selectedPayment.id}
                    className="btn-primary"
                  >
                    {processingPayment === selectedPayment.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}