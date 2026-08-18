import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account';
  last_four: string;
  brand?: string;
  is_default: boolean;
}

export default function VendorPaymentForm() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'credit_card' as 'credit_card' | 'bank_account',
    routing_number: '',

    account_number: '',
    full_legal_name: '',
    bank_name: '',
    bank_address: '',
    owner_address: '',
    account_type: 'checking' as 'checking' | 'savings',
    swift_code: '',
    iban: '',
    wire_instructions: ''
  });

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_payment_methods')
        .select('id, vendor_id, stripe_payment_method_id, type, last_four, brand, is_default, created_at, updated_at')
        .eq('vendor_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        setPaymentMethods(data.map(pm => ({
          id: pm.stripe_payment_method_id,
          type: pm.type as 'credit_card' | 'bank_account',
          last_four: pm.last_four,
          brand: pm.brand,
          is_default: pm.is_default
        })));
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const addPaymentMethod = async () => {
    if (!user) return;

    // Card payments are handled by StripeCardCapture (client-side tokenization).
    if (newPaymentMethod.type !== 'bank_account') return;

    if (!newPaymentMethod.full_legal_name || !newPaymentMethod.bank_name ||
        !newPaymentMethod.routing_number || !newPaymentMethod.account_number) {
      toast.error('Please fill in all required bank account fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('create-payment-method', {
        body: {
          type: 'bank_account',
          bankDetails: {
            full_legal_name: newPaymentMethod.full_legal_name,
            bank_name: newPaymentMethod.bank_name,
            bank_address: newPaymentMethod.bank_address,
            owner_address: newPaymentMethod.owner_address,
            account_type: newPaymentMethod.account_type,
            routing_number: newPaymentMethod.routing_number,
            account_number: newPaymentMethod.account_number,
            swift_code: newPaymentMethod.swift_code,
            iban: newPaymentMethod.iban,
            wire_instructions: newPaymentMethod.wire_instructions
          }
        }
      });

      if (error) throw error;

      await fetchPaymentMethods();
      setShowAddForm(false);
      setNewPaymentMethod({
        type: 'credit_card',
        routing_number: '',
        account_number: '',
        full_legal_name: '',
        bank_name: '',
        bank_address: '',
        owner_address: '',
        account_type: 'checking',
        swift_code: '',
        iban: '',
        wire_instructions: ''
      });


      toast.success('Payment method added successfully');
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      toast.error(error.message || 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const removePaymentMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_payment_methods')
        .delete()
        .eq('stripe_payment_method_id', methodId);

      if (error) throw error;

      setPaymentMethods(paymentMethods.filter(pm => pm.id !== methodId));
      toast.success('Payment method removed');
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method');
    }
  };

  const setDefaultPaymentMethod = async (methodId: string) => {
    try {
      // First, set all methods to non-default
      await supabase
        .from('vendor_payment_methods')
        .update({ is_default: false })
        .eq('vendor_id', user?.id);

      // Then set the selected method as default
      const { error } = await supabase
        .from('vendor_payment_methods')
        .update({ is_default: true })
        .eq('stripe_payment_method_id', methodId);

      if (error) throw error;

      setPaymentMethods(paymentMethods.map(pm => ({
        ...pm,
        is_default: pm.id === methodId
      })));

      toast.success('Default payment method updated');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast.error('Failed to update default payment method');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Payment Methods</h3>
          <p className="text-sm text-muted-foreground">
            Manage your payment methods for subscription and fees
          </p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={newPaymentMethod.type}
                  onValueChange={(value: 'credit_card' | 'bank_account') => 
                    setNewPaymentMethod({ ...newPaymentMethod, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="bank_account">Bank Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPaymentMethod.type === 'credit_card' ? (
                <StripeCardCapture
                  onAdded={async () => {
                    await fetchPaymentMethods();
                    setShowAddForm(false);
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : (

                <>
                  <div className="space-y-2">
                    <Label>Full Legal Name *</Label>
                    <Input
                      placeholder="John Doe"
                      value={newPaymentMethod.full_legal_name}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        full_legal_name: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input
                      placeholder="Chase Bank"
                      value={newPaymentMethod.bank_name}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        bank_name: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bank Address</Label>
                    <Input
                      placeholder="123 Bank St, New York, NY 10001"
                      value={newPaymentMethod.bank_address}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        bank_address: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Holder Address</Label>
                    <Input
                      placeholder="456 Main St, New York, NY 10002"
                      value={newPaymentMethod.owner_address}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        owner_address: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Type *</Label>
                    <Select
                      value={newPaymentMethod.account_type}
                      onValueChange={(value: 'checking' | 'savings') => 
                        setNewPaymentMethod({ ...newPaymentMethod, account_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Routing Number *</Label>
                    <Input
                      placeholder="123456789"
                      value={newPaymentMethod.routing_number}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        routing_number: e.target.value.replace(/\D/g, '')
                      })}
                      maxLength={9}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <Input
                      placeholder="1234567890"
                      value={newPaymentMethod.account_number}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        account_number: e.target.value.replace(/\D/g, '')
                      })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>SWIFT/BIC Code (for international)</Label>
                    <Input
                      placeholder="CHASUS33"
                      value={newPaymentMethod.swift_code}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        swift_code: e.target.value.toUpperCase()
                      })}
                      maxLength={11}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>IBAN (for international)</Label>
                    <Input
                      placeholder="GB29 NWBK 6016 1331 9268 19"
                      value={newPaymentMethod.iban}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        iban: e.target.value.toUpperCase()
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Wire Transfer Instructions</Label>
                    <Input
                      placeholder="Additional wire transfer details"
                      value={newPaymentMethod.wire_instructions}
                      onChange={(e) => setNewPaymentMethod({
                        ...newPaymentMethod,
                        wire_instructions: e.target.value
                      })}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button onClick={addPaymentMethod} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Payment Method'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-3">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Payment Methods</h3>
              <p className="text-muted-foreground mb-4">
                Add a payment method to handle subscription fees and vendor payments
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                Add First Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {method.type === 'credit_card' ? 'Credit Card' : 'Bank Account'}
                          {method.brand && ` (${method.brand.toUpperCase()})`}
                        </span>
                        {method.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ****{method.last_four}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultPaymentMethod(method.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePaymentMethod(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}