import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PrivatePageWrapper from '@/components/PrivatePageWrapper';
import { CheckCircle, AlertCircle, DollarSign, CreditCard, Building2, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedPageBackground from '@/components/shared/EnhancedPageBackground';
import PageHeroWithImage from '@/components/shared/PageHeroWithImage';

interface PayoutSettings {
  id: string;
  bank_account_last4: string | null;
  account_holder_name: string | null;
  routing_number: string | null;
  payout_method: string;
  payout_schedule: string;
  minimum_payout_amount: number;
  is_verified: boolean;
  verified_at: string | null;
  card_last4?: string | null;
  card_brand?: string | null;
}

export default function VendorPayoutSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PayoutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payoutType, setPayoutType] = useState<'bank' | 'card'>('bank');
  
  const [formData, setFormData] = useState({
    account_holder_name: '',
    routing_number: '',
    account_number: '',
    confirm_account_number: '',
    payout_method: 'ach',
    minimum_payout_amount: '50.00',
    // Card fields
    card_number: '',
    card_expiry: '',
    card_holder_name: ''
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_payout_settings')
        .select('id, vendor_id, bank_account_last4, account_holder_name, routing_number, payout_method, payout_schedule, minimum_payout_amount, is_verified, verified_at, created_at, updated_at')
        .eq('vendor_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Cast to include card fields that may exist after migration
        const settingsData = data as PayoutSettings;
        setSettings(settingsData);
        if (settingsData.payout_method === 'debit_card') {
          setPayoutType('card');
        }
        setFormData({
          account_holder_name: settingsData.account_holder_name || '',
          routing_number: settingsData.routing_number || '',
          account_number: '',
          confirm_account_number: '',
          payout_method: settingsData.payout_method || 'ach',
          minimum_payout_amount: settingsData.minimum_payout_amount?.toString() || '50.00',
          card_number: '',
          card_expiry: '',
          card_holder_name: settingsData.account_holder_name || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load payout settings');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSave = async () => {
    if (payoutType === 'bank') {
      if (formData.account_number && formData.account_number !== formData.confirm_account_number) {
        toast.error('Account numbers do not match');
        return;
      }

      if (!formData.account_holder_name || !formData.routing_number) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else {
      // Card validation
      if (!formData.card_holder_name) {
        toast.error('Please enter cardholder name');
        return;
      }
      if (formData.card_number && formData.card_number.replace(/\s/g, '').length < 15) {
        toast.error('Please enter a valid card number');
        return;
      }
    }

    try {
      setSaving(true);

      let payload: any = {
        vendor_id: user?.id,
        minimum_payout_amount: parseFloat(formData.minimum_payout_amount),
        is_verified: false // Admin must verify
      };

      if (payoutType === 'bank') {
        const accountLast4 = formData.account_number ? formData.account_number.slice(-4) : settings?.bank_account_last4;
        payload = {
          ...payload,
          account_holder_name: formData.account_holder_name,
          routing_number: formData.routing_number,
          bank_account_last4: accountLast4,
          payout_method: formData.payout_method,
          card_last4: null,
          card_brand: null
        };
      } else {
        // Card payout
        const cardDigits = formData.card_number.replace(/\s/g, '');
        const cardLast4 = cardDigits ? cardDigits.slice(-4) : settings?.card_last4;
        const cardBrand = detectCardBrand(cardDigits);
        
        payload = {
          ...payload,
          account_holder_name: formData.card_holder_name,
          payout_method: 'debit_card',
          card_last4: cardLast4,
          card_brand: cardBrand,
          routing_number: null,
          bank_account_last4: null
        };
      }

      const { error } = await supabase
        .from('vendor_payout_settings')
        .upsert(payload, { onConflict: 'vendor_id' });

      if (error) throw error;

      toast.success('Payout settings saved! Admin will verify your information.');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const detectCardBrand = (number: string): string => {
    const patterns: Record<string, RegExp> = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/
    };
    
    for (const [brand, pattern] of Object.entries(patterns)) {
      if (pattern.test(number)) return brand;
    }
    return 'unknown';
  };

  if (loading) {
    return (
      <PrivatePageWrapper title="Payout Settings">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PrivatePageWrapper>
    );
  }

  return (
    <PrivatePageWrapper title="Payout Settings">
      <EnhancedPageBackground pattern="mesh" gradient="radial" primaryColor="info" intensity="subtle" showOrbs>
        <div className="max-w-2xl mx-auto py-6 space-y-6">
          <PageHeroWithImage
            title="Payout Settings"
            description="Configure how you receive payments"
            icon={Settings}
            backgroundImage="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80"
          />

        {/* Verification Status */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings?.is_verified ? (
                  <>
                    <div className="p-2 rounded-full bg-success/20">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Verified Account</p>
                      <p className="text-sm text-muted-foreground">
                        Your payout information has been verified
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-full bg-warning/20">
                      <AlertCircle className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Verification Pending</p>
                      <p className="text-sm text-muted-foreground">
                        Admin will review your payout information
                      </p>
                    </div>
                  </>
                )}
              </div>
              {settings?.is_verified && (
                <Badge className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40">Verified</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">Select Payout Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={payoutType} onValueChange={(v) => setPayoutType(v as 'bank' | 'card')} className="w-full">
              <TabsList variant="grid" className="grid w-full grid-cols-2">
                <TabsTrigger variant="grid" value="bank" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Bank Account
                </TabsTrigger>
                <TabsTrigger variant="grid" value="card" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Debit Card
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bank" className="space-y-4 mt-4">
                <div>
                  <Label>Account Holder Name *</Label>
                  <Input
                    value={formData.account_holder_name}
                    onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label>Routing Number *</Label>
                  <Input
                    value={formData.routing_number}
                    onChange={(e) => setFormData({...formData, routing_number: e.target.value})}
                    placeholder="123456789"
                    maxLength={9}
                  />
                  <p className="text-xs text-muted-foreground mt-1">9-digit routing number</p>
                </div>

                {settings?.bank_account_last4 && (
                  <div>
                    <Label>Current Account</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-mono">****{settings.bank_account_last4}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label>New Account Number (optional)</Label>
                  <Input
                    type="password"
                    value={formData.account_number}
                    onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                    placeholder="Enter to update account"
                  />
                </div>

                {formData.account_number && (
                  <div>
                    <Label>Confirm Account Number *</Label>
                    <Input
                      type="password"
                      value={formData.confirm_account_number}
                      onChange={(e) => setFormData({...formData, confirm_account_number: e.target.value})}
                      placeholder="Re-enter account number"
                    />
                  </div>
                )}

                <div>
                  <Label>Transfer Method</Label>
                  <Select value={formData.payout_method} onValueChange={(v) => setFormData({...formData, payout_method: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ach">ACH Transfer (2-3 business days)</SelectItem>
                      <SelectItem value="wire">Wire Transfer (Same day)</SelectItem>
                      <SelectItem value="check">Paper Check (5-7 business days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="card" className="space-y-4 mt-4">
                <div className="p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">Debit Card Payouts</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive payouts directly to your debit card. Funds typically arrive within 30 minutes.
                  </p>
                </div>

                <div>
                  <Label>Cardholder Name *</Label>
                  <Input
                    value={formData.card_holder_name}
                    onChange={(e) => setFormData({...formData, card_holder_name: e.target.value})}
                    placeholder="JOHN DOE"
                    className="uppercase"
                  />
                </div>

                {settings?.card_last4 && (
                  <div>
                    <Label>Current Card</Label>
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-mono capitalize">{settings.card_brand} ****{settings.card_last4}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Card Number {settings?.card_last4 ? '(optional - enter to update)' : '*'}</Label>
                  <Input
                    value={formData.card_number}
                    onChange={(e) => setFormData({...formData, card_number: formatCardNumber(e.target.value)})}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Only Visa and Mastercard debit cards are accepted</p>
                </div>

                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    value={formData.card_expiry}
                    onChange={(e) => setFormData({...formData, card_expiry: formatExpiry(e.target.value)})}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Payout Preferences */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">Payout Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Minimum Payout Amount</Label>
              <Input
                type="number"
                value={formData.minimum_payout_amount}
                onChange={(e) => setFormData({...formData, minimum_payout_amount: e.target.value})}
                min="10"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Payouts will accumulate until reaching this amount
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-info/10 border-info/30 dark:bg-info/20 dark:border-info/40">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">
                  Security & Privacy
                </p>
                <p className="text-muted-foreground">
                  Your banking and card information is encrypted and secure. Only the last 4 digits are stored. Full account/card details are never displayed after initial setup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Payout Settings'}
        </Button>
        </div>
      </EnhancedPageBackground>
    </PrivatePageWrapper>
  );
}
