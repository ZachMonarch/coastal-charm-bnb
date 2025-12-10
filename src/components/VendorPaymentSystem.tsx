import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, CreditCard, FileText, Calendar, Clock, 
  CheckCircle, AlertCircle, Download, Eye, Plus 
} from 'lucide-react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { getPaymentStatusColor } from '@/utils/themeColors';

interface VendorPayment {
  id: string;
  title: string;
  description: string;
  amount: number;
  payment_type: string;
  status: string;
  due_date: string;
  paid_at?: string;
  created_at: string;
  metadata?: any;
}

export default function VendorPaymentSystem() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOwed: 0,
    totalPaid: 0,
    pendingCount: 0,
    overdueCount: 0
  });

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
        .select('id, title, description, amount, payment_type, status, due_date, paid_at, created_at, metadata')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setPayments(data || []);
      
      // Calculate stats
      const totalOwed = data?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalPaid = data?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pendingCount = data?.filter(p => p.status === 'pending').length || 0;
      const overdueCount = data?.filter(p => p.status === 'pending' && new Date(p.due_date) < new Date()).length || 0;

      setStats({ totalOwed, totalPaid, pendingCount, overdueCount });
    } catch (error) {
      logger.error('Error fetching payments:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (paymentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-vendor-payment', {
        body: { payment_id: paymentId }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      logger.error('Error creating payment:', error);
      toast.error('Failed to create payment session');
    }
  };

  // Status color function removed - using imported utility

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'overdue': return AlertCircle;
      case 'processing': return Clock;
      default: return FileText;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');
  const processingPayments = payments.filter(p => p.status === 'processing');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Payment Center</h1>
        <p className="text-muted-foreground">
          Manage your vendor fees, subscriptions, and payment history
        </p>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-destructive mx-auto mb-2" />
            <div className="text-2xl font-bold text-destructive">${stats.totalOwed.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Amount Due</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-success">${stats.totalPaid.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total Paid</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <div className="text-2xl font-bold text-destructive">{stats.overdueCount}</div>
            <p className="text-sm text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList variant="grid" className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="pending" variant="grid">
            Pending ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="processing" variant="grid">
            Processing ({processingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="paid" variant="grid">
            Paid ({paidPayments.length})
          </TabsTrigger>
          <TabsTrigger value="history" variant="grid">
            All History ({payments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingPayments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending payments at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onPayNow={handlePayNow}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {processingPayments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-info mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Processing Payments</h3>
                <p className="text-muted-foreground">Payments being processed will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {processingPayments.map((payment) => (
                <PaymentCard key={payment.id} payment={payment} showActions={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <div className="space-y-4">
            {paidPayments.map((payment) => (
              <PaymentCard key={payment.id} payment={payment} showActions={false} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {payments.map((payment) => (
              <PaymentCard 
                key={payment.id} 
                payment={payment} 
                onPayNow={handlePayNow}
                showActions={payment.status === 'pending'} 
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PaymentCardProps {
  payment: VendorPayment;
  onPayNow?: (paymentId: string) => void;
  showActions: boolean;
}

function PaymentCard({ payment, onPayNow, showActions }: PaymentCardProps) {
  const StatusIcon = getStatusIcon(payment.status);
  const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();
  const actualStatus = isOverdue ? 'overdue' : payment.status;

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-destructive/30 dark:border-destructive/40' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold">{payment.title}</h3>
              <Badge className={getPaymentStatusColor(actualStatus)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
              </Badge>
              {payment.payment_type && (
                <Badge variant="outline">{payment.payment_type}</Badge>
              )}
            </div>
            
            {payment.description && (
              <p className="text-sm text-muted-foreground mb-3">{payment.description}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">${Number(payment.amount).toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Due: {new Date(payment.due_date).toLocaleDateString()}</span>
              </div>
              {payment.paid_at && (
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Paid: {new Date(payment.paid_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-xl font-bold">${Number(payment.amount).toFixed(2)}</div>
              {isOverdue && (
                <div className="text-xs text-destructive font-medium">
                  Overdue by {Math.ceil((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              )}
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            <Button 
              size="sm" 
              onClick={() => onPayNow?.(payment.id)}
              variant={isOverdue ? 'destructive' : 'default'}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Pay Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Removed duplicate function - using imported utility from themeColors

function getStatusIcon(status: string) {
  switch (status) {
    case 'paid': return CheckCircle;
    case 'pending': return Clock;
    case 'overdue': return AlertCircle;
    case 'processing': return Clock;
    default: return FileText;
  }
}