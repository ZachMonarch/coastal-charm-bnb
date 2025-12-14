import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Star, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ButtonSpinner } from '@/components/shared/LoadingSpinner';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface PendingRequest {
  id: string;
  requested_plan: string;
  status: string;
  requested_at: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Basic access only - no marketplace visibility',
    features: [
      'View public project listings',
      'Basic profile creation',
      'Access to basic resources'
    ],
    limitations: [
      'Not visible in vendor marketplace',
      'Cannot apply to projects',
      'No verified badge',
      'Limited support',
      'No analytics'
    ],
    icon: Star,
    color: 'text-muted-foreground'
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 49.99,
    interval: 'month',
    description: 'Essential features for active vendors',
    features: [
      'Visible in vendor marketplace',
      'Apply to up to 5 projects/month',
      'Public profile showcase page',
      'Basic verified badge eligibility',
      'Email support',
      'Basic analytics',
      'Project bid submissions',
      'Client communication tools'
    ],
    limitations: [
      'Limited to 5 applications',
      'Basic verification only',
      'Standard support response'
    ],
    icon: Zap,
    color: 'text-info'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 99.99,
    interval: 'month',
    description: 'Advanced features for growing businesses',
    features: [
      'Featured vendor listing in marketplace',
      'Unlimited project applications',
      'Premium profile showcase with portfolio',
      'Full verified badge with priority display',
      'Trusted Vendor badge',
      'Priority email & phone support',
      'Advanced analytics & insights',
      'Access to exclusive RFQ opportunities',
      'Custom proposals & contracts',
      'Project management tools'
    ],
    limitations: [],
    popular: true,
    icon: Crown,
    color: 'text-primary'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399.99,
    interval: 'month',
    description: 'Full-featured solution for large operations',
    features: [
      'Priority marketplace placement',
      'All Premium features',
      'Enterprise verified badge',
      'White-label vendor portal',
      'API access for integrations',
      'Dedicated account manager',
      '24/7 priority support',
      'Custom contract negotiations',
      'Bulk project management',
      'Team collaboration tools',
      'Advanced reporting & analytics',
      'Custom branding options'
    ],
    limitations: [],
    icon: Crown,
    color: 'text-primary'
  }
];

export default function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Check for pending subscription request
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!user?.id) {
        setLoadingRequest(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('subscription_requests')
          .select('id, requested_plan, status, requested_at')
          .eq('vendor_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking pending request:', error);
        }
        
        setPendingRequest(data);
      } catch (error) {
        console.error('Error checking pending request:', error);
      } finally {
        setLoadingRequest(false);
      }
    };

    checkPendingRequest();
  }, [user?.id]);

  const handleRequestUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    
    setIsProcessing(true);
    setSelectedPlan(planId);
    
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan || !user) {
        throw new Error('Plan not found or user not authenticated');
      }

      const currentPlan = user?.subscription?.plan || 'free';

      // Call the request-subscription-upgrade edge function
      const { data, error } = await supabase.functions.invoke('request-subscription-upgrade', {
        body: {
          requestedPlan: planId,
          currentPlan: currentPlan
        }
      });

      if (error) throw error;

      toast({
        title: "Upgrade Request Submitted",
        description: "Your subscription upgrade request has been submitted. An admin will review it shortly.",
      });

      // Update local state
      setPendingRequest({
        id: data.request.id,
        requested_plan: planId,
        status: 'pending',
        requested_at: new Date().toISOString()
      });

    } catch (error: unknown) {
      console.error('Subscription request error:', error);
      const errorMessage = error instanceof Error ? error.message : "There was an error submitting your request. Please try again.";
      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlan('');
    }
  };

  const currentPlan = user?.subscription?.plan || 'free';

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-4">
          Vendor Subscription Plans
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan to grow your business and access premium opportunities
        </p>
      </div>

      {/* Pending Request Banner */}
      {pendingRequest && (
        <Card className="border-warning/30 bg-warning/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium text-warning">Pending Upgrade Request</p>
                <p className="text-sm text-warning/80">
                  Your request to upgrade to <strong>{pendingRequest.requested_plan}</strong> plan is being reviewed by an admin.
                </p>
              </div>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                Pending Review
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin-only notice */}
      <Card className="border-info/30 bg-info/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-info" />
            <p className="text-sm text-info">
              <strong>Note:</strong> Subscription upgrades require admin approval. When you request an upgrade, an administrator will review and process your request.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const canUpgrade = plans.findIndex(p => p.id === currentPlan) < plans.findIndex(p => p.id === plan.id);
          const isPendingPlan = pendingRequest?.requested_plan === plan.id;
          
          return (
            <Card 
              key={plan.id} 
              className={`neumorphic-card relative ${plan.popular ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-12 h-12 neumorphic-card rounded-2xl p-2 flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${plan.color}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
                </div>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-primary mb-2">Included Features:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-2">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="h-4 w-4 flex-shrink-0 mt-0.5 rounded-full border border-muted-foreground/30" />
                            <span>{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button disabled className="w-full">
                      Current Plan
                    </Button>
                  ) : plan.id === 'free' ? (
                    <Button variant="outline" disabled className="w-full">
                      Free Forever
                    </Button>
                  ) : isPendingPlan ? (
                    <Button disabled className="w-full" variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Pending Approval
                    </Button>
                  ) : pendingRequest ? (
                    <Button disabled variant="outline" className="w-full">
                      Request Pending
                    </Button>
                  ) : canUpgrade ? (
                    <Button 
                      className="w-full btn-primary" 
                      onClick={() => handleRequestUpgrade(plan.id)}
                      disabled={isProcessing || selectedPlan === plan.id || loadingRequest}
                    >
                      {isProcessing && selectedPlan === plan.id ? (
                        <>
                          <ButtonSpinner className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Request Upgrade
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled className="w-full">
                      Downgrade Available
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {user?.subscription && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Current subscription: <span className="font-semibold">
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </span>
            {user.subscription?.expiresAt && (
              <span> • Expires: {new Date(user.subscription.expiresAt).toLocaleDateString()}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
