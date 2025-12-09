import { useState } from 'react';
import { Check, Crown, Zap, Star, ExternalLink } from 'lucide-react';
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

const plans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Basic access to view projects',
    features: [
      'View public project listings',
      'Basic profile creation',
      'Contact property managers',
      'Access to basic resources'
    ],
    limitations: [
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
      'Apply to up to 5 projects/month',
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
      'Unlimited project applications',
      'Full verified badge with priority display',
      'Priority email & phone support',
      'Advanced analytics & insights',
      'Featured vendor listing',
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
      'All Premium features',
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
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') return;
    
    setIsProcessing(true);
    setSelectedPlan(planId);
    
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan || !user) {
        throw new Error('Plan not found or user not authenticated');
      }

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId: planId,
          planName: plan.name,
          price: plan.price,
          interval: plan.interval
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to payment",
          description: "Opening Stripe checkout in a new tab.",
        });
      }
    } catch (error: unknown) {
      console.error('Subscription error:', error);
      const errorMessage = error instanceof Error ? error.message : "There was an error processing your payment. Please try again.";
      toast({
        title: "Payment Failed",
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id;
          const canUpgrade = plans.findIndex(p => p.id === currentPlan) < plans.findIndex(p => p.id === plan.id);
          
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
                  ) : canUpgrade ? (
                    <Button 
                      className="w-full btn-primary" 
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isProcessing || selectedPlan === plan.id}
                    >
                      {isProcessing && selectedPlan === plan.id ? (
                        <>
                          <ButtonSpinner className="mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Upgrade to {plan.name}
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