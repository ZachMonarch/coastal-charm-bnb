import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, CreditCard, Calendar, FileText, ExternalLink } from 'lucide-react';
import VendorPaymentForm from './VendorPaymentForm';
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
  created_at: string;
}

export default function CompleteVendorPaymentFlow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('id, vendor_id, title, description, amount, payment_type, status, due_date, created_at, updated_at')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      logger.error('Error fetching vendor payments', { 
        userId: user.id,
        errorMessage: error.message 
      });
      toast({
        title: "Error",
        description: "Failed to load payments.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-vendor-payment', {
        body: {
          paymentId,
          returnUrl: `${window.location.origin}/vendor/payments`
        }
      });

      if (error) throw error;

      // Open Stripe checkout in same tab
      window.location.href = data.url;
    } catch (error: any) {
      logger.error('Error creating payment session', { 
        paymentId,
        errorMessage: error.message 
      });
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Status color function removed - using imported utility

  const getPaymentTypeLabel = (type: string) => {
    const types = {
      'background_check': 'Background Check',
      'service_fee': 'Service Fee',
      'security_bond': 'Security Bond Certificate',
      'osha_certification': 'OSHA Certification',
      'custom': 'Custom Payment'
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Payment Center</h2>
          <p className="text-muted-foreground">Manage your payments and payment methods</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowPaymentMethods(!showPaymentMethods)}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Payment Methods
        </Button>
      </div>

      {showPaymentMethods && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VendorPaymentForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Outstanding Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments required</p>
              <p className="text-sm text-muted-foreground">All your payments are up to date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{payment.title}</h3>
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      <Badge variant="outline">
                        {getPaymentTypeLabel(payment.payment_type)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${payment.amount.toFixed(2)}
                      </span>
                      {payment.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {payment.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {payment.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {payment.status === 'pending' && (
                      <Button 
                        onClick={() => handlePayment(payment.id)}
                        size="sm"
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}