
import { useState, useEffect } from 'react';
import { Check, Loader2, Crown, Star, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PendingRequest {
  id: string;
  requested_plan: string;
  status: string;
  requested_at: string;
}

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

const plans = [
  {
    name: 'Basic',
    price: 49.99,
    priceId: 'price_basic',
    description: 'Essential vendor features',
    icon: Star,
    color: 'text-info',
    bgColor: 'bg-info/10',
    features: [
      'Up to 3 properties',
      'Basic maintenance requests',
      'Email support',
      'Property photos (5 per property)',
      'Basic tenant screening'
    ],
    popular: false
  },
  {
    name: 'Premium',
    price: 99.99,
    priceId: 'price_premium',
    description: 'Advanced vendor capabilities',
    icon: Crown,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    features: [
      'Up to 15 properties',
      'Advanced RFQ system',
      'Priority vendor network',
      'Phone & email support',
      'Unlimited property photos',
      'Advanced analytics',
      'Automated rent collection',
      'Professional tenant screening'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 399.99,
    priceId: 'price_enterprise',
    description: 'Full enterprise solution',
    icon: Zap,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    features: [
      'Unlimited properties',
      'White-label solution',
      'Dedicated account manager',
      '24/7 priority support',
      'Custom integrations',
      'Advanced reporting suite',
      'Multi-location management',
      'Custom vendor onboarding'
    ],
    popular: false
  }
];

export default function SubscriptionPlansEnhanced() {
  const [loading, setLoading] = useState<string | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const checkSubscription = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Failed to check subscription status');
    } finally {
      setRefreshing(false);
    }
  };

  const checkPendingRequest = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select('id, requested_plan, status, requested_at')
        .eq('vendor_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (!error && data) {
        setPendingRequest(data);
      }
    } catch (error) {
      console.error('Error checking pending request:', error);
    }
  };

  const handleRequestUpgrade = async (planName: string) => {
    if (!user) {
      toast.error('Please sign in to request an upgrade');
      return;
    }

    if (pendingRequest) {
      toast.error('You already have a pending subscription request');
      return;
    }

    setLoading(planName);
    try {
      const { data, error } = await supabase.functions.invoke('request-subscription-upgrade', {
        body: {
          requestedPlan: planName.toLowerCase(),
          currentPlan: subscriptionInfo?.subscription_tier || 'none'
        }
      });

      if (error) throw error;

      toast.success('Subscription upgrade request submitted! An admin will review it shortly.');
      await checkPendingRequest();
    } catch (error) {
      console.error('Error requesting upgrade:', error);
      toast.error('Failed to submit upgrade request');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setLoading('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open customer portal');
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
      checkPendingRequest();
    }
  }, [user]);

  const isCurrentPlan = (planName: string) => {
    return subscriptionInfo?.subscription_tier?.toLowerCase() === planName.toLowerCase();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the perfect plan for your property management needs
        </p>
        
        {subscriptionInfo && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <Badge variant={subscriptionInfo.subscribed ? "default" : "secondary"} className="text-sm">
                {subscriptionInfo.subscribed 
                  ? `Active: ${subscriptionInfo.subscription_tier}` 
                  : 'No Active Subscription'
                }
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={checkSubscription}
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh Status'}
              </Button>
            </div>
            
            {pendingRequest && (
              <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/30 rounded-lg">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning-foreground">
                  Pending request for <strong>{pendingRequest.requested_plan}</strong> plan - awaiting admin approval
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = isCurrentPlan(plan.name);
          
          return (
            <Card 
              key={plan.name} 
              className={`relative neumorphic-card ${plan.popular ? 'ring-2 ring-primary scale-105' : ''} ${isCurrent ? 'ring-2 ring-success' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-success text-success-foreground">Current Plan</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6">
                <div className={`neumorphic-inset p-4 rounded-2xl w-fit mx-auto mb-4 ${plan.bgColor}`}>
                  <Icon className={`h-8 w-8 ${plan.color}`} />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {isCurrent ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleManageSubscription}
                      disabled={loading === 'manage'}
                    >
                      {loading === 'manage' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Manage Subscription
                    </Button>
                  ) : pendingRequest?.requested_plan?.toLowerCase() === plan.name.toLowerCase() ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Request Pending
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${plan.popular ? 'btn-primary' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleRequestUpgrade(plan.name)}
                      disabled={loading === plan.name || !user || !!pendingRequest}
                    >
                      {loading === plan.name ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {subscriptionInfo?.subscribed ? 'Request Upgrade' : 'Request Subscription'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center space-y-4 pt-8">
        <p className="text-sm text-muted-foreground">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>✓ No setup fees</span>
          <span>✓ SSL encryption</span>
          <span>✓ 99.9% uptime SLA</span>
        </div>
      </div>
    </div>
  );
}
