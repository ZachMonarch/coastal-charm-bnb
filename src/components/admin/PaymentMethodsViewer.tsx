import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Building2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentMethod {
  id: string;
  type: string;
  is_default: boolean;
  created_at: string;
  vendor_id: string;
}

interface PaymentMethodsViewerProps {
  vendorId: string;
}

/**
 * PaymentMethodsViewer - Admin component to view vendor payment methods
 * Access is logged to audit_logs for security compliance
 */
export function PaymentMethodsViewer({ vendorId }: PaymentMethodsViewerProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to call the RPC if it exists
        const { data, error: rpcError } = await supabase.rpc('admin_get_vendor_payment_methods', {
          target_vendor_id: vendorId
        });
        
        if (rpcError) {
          // If RPC doesn't exist, show a helpful message
          if (rpcError.message.includes('does not exist')) {
            setError('Payment methods viewer not yet configured. Please contact system administrator.');
          } else {
            throw rpcError;
          }
        } else if (data) {
          // Map RPC response to our interface (handles both old and new column names)
          const mappedData = (data as any[]).map((item: any) => ({
            id: item.id,
            vendor_id: item.vendor_id,
            type: item.type || item.payment_type || 'unknown',
            is_default: item.is_default ?? item.is_primary ?? false,
            created_at: item.created_at,
          }));
          setMethods(mappedData);
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setError('Failed to load payment methods');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMethods();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No payment methods on file
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map(method => (
        <div key={method.id} className="flex items-center gap-3 p-4 border rounded-lg bg-card">
          {method.type === 'bank_account' ? (
            <Building2 className="h-5 w-5 text-primary" />
          ) : (
            <CreditCard className="h-5 w-5 text-primary" />
          )}
          <div className="flex-1">
            <p className="font-medium text-foreground capitalize">
              {method.type?.replace('_', ' ') || 'Payment Method'}
            </p>
            <p className="text-sm text-muted-foreground">
              Added: {new Date(method.created_at).toLocaleDateString()}
            </p>
          </div>
          {method.is_default && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              Default
            </span>
          )}
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-4">
        Access logged for audit purposes
      </p>
    </div>
  );
}

export default PaymentMethodsViewer;
