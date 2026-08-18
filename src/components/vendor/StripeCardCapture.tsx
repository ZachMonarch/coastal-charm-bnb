import React, { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * PCI-safe card capture.
 * Card data is tokenized directly in the browser by Stripe.js — the raw PAN/CVV
 * never touches our edge functions, logs, or database. Only the resulting
 * payment method id is sent to the backend for storage.
 */

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

interface StripeCardCaptureProps {
  onAdded: () => void;
  onCancel: () => void;
}

const CardFields: React.FC<StripeCardCaptureProps> = ({ onAdded, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [nameOnCard, setNameOnCard] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const cardOptions = useMemo(
    () => ({
      hidePostalCode: false,
      style: {
        base: {
          fontSize: '16px',
          color: isDark ? '#f8fafc' : '#1f2937',
          '::placeholder': { color: isDark ? '#94a3b8' : '#6b7280' },
        },
        invalid: { color: '#dc2626' },
      },
    }),
    [isDark]
  );

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    if (!nameOnCard.trim()) {
      toast.error('Please enter the name on the card');
      return;
    }

    setSubmitting(true);
    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: nameOnCard.trim(),
          address: billingAddress.trim() ? { line1: billingAddress.trim() } : undefined,
        },
      });

      if (stripeError || !paymentMethod) {
        toast.error(stripeError?.message || 'Unable to validate card details');
        return;
      }

      const { error } = await supabase.functions.invoke('create-payment-method', {
        body: { type: 'credit_card', paymentMethodId: paymentMethod.id },
      });

      if (error) throw error;

      cardElement.clear();
      setNameOnCard('');
      setBillingAddress('');
      toast.success('Payment method added successfully');
      onAdded();
    } catch (err) {
      console.error('Error adding card payment method:', err);
      toast.error('Failed to add payment method. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="card-element">Card Details</Label>
        <div
          id="card-element"
          className="rounded-md border border-input bg-background px-3 py-3"
        >
          <CardElement options={cardOptions} />
        </div>
        <p className="text-xs text-muted-foreground">
          Card details are sent directly to Stripe and never stored on our servers.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name-on-card">Name on Card</Label>
        <Input
          id="name-on-card"
          placeholder="John Doe"
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
          autoComplete="cc-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="billing-address">Billing Address</Label>
        <Input
          id="billing-address"
          placeholder="123 Main St, New York, NY 10001"
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
          autoComplete="billing street-address"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !stripe}>
          {submitting ? 'Adding...' : 'Add Card'}
        </Button>
      </div>
    </div>
  );
};

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const StripeCardCapture: React.FC<StripeCardCaptureProps> = (props) => {
  if (!stripePromise) {
    return (
      <Alert>
        <AlertDescription>
          Card payments are not configured yet. Please contact support or add a bank account
          instead.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CardFields {...props} />
    </Elements>
  );
};

export default StripeCardCapture;
