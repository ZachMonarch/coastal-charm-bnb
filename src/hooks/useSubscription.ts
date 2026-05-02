
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/OptimizedAuthContext';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  trialing?: boolean;
  trial_end?: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const checkSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: functionError } = await supabase.functions.invoke('check-subscription');
      
      if (functionError) throw functionError;
      
      setSubscription(data);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to check subscription');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (planName: string, priceAmount: number) => {
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceAmount: Math.round(priceAmount * 100), // Convert to cents
        subscriptionType: planName.toLowerCase()
      }
    });

    if (error) throw error;
    return data;
  };

  const openCustomerPortal = async () => {
    if (!user) throw new Error('User must be authenticated');

    const { data, error } = await supabase.functions.invoke('customer-portal');
    if (error) throw error;
    return data;
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  // Auto-refresh subscription status every 30 seconds when user is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkSubscription();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return {
    subscription,
    loading,
    error,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    hasActiveSubscription: subscription?.subscribed || false,
    isTrialing: subscription?.trialing || false,
    trialEnd: subscription?.trial_end,
    subscriptionTier: subscription?.subscription_tier,
    subscriptionEnd: subscription?.subscription_end
  };
}
