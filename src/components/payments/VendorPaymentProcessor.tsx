import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Loader2, DollarSign, CheckCircle } from 'lucide-react';

interface VendorPaymentProcessorProps {
  payment: {
    id: string;
    title: string;
    amount: number;
    description?: string;
    status: string;
    due_date?: string;
  };
  onSuccess?: () => void;
}

export default function VendorPaymentProcessor({ payment, onSuccess }: VendorPaymentProcessorProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          payment_id: payment.id,
          amount: payment.amount,
          description: payment.title,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Redirecting to payment page...');
        
        // Poll for payment status
        setTimeout(() => {
          onSuccess?.();
        }, 3000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  if (payment.status === 'paid') {
    return (
      <Badge className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40">
        <CheckCircle className="h-3 w-3 mr-1" />
        Paid
      </Badge>
    );
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      variant="default"
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay ${payment.amount.toFixed(2)}
        </>
      )}
    </Button>
  );
}
