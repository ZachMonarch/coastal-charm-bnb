import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, Shield, Trophy, Users, TrendingUp, Eye, 
  Zap, Star, Globe, CheckCircle2, Sparkles, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ShowcaseBenefitsProps {
  currentPlan?: string;
  isVerified?: boolean;
}

export default function VendorShowcaseBenefits({ 
  currentPlan = 'free', 
  isVerified = false 
}: ShowcaseBenefitsProps) {
  const navigate = useNavigate();
  const isPremium = currentPlan === 'premium' || currentPlan === 'enterprise';
  const isBasic = currentPlan === 'basic';

  const benefits = [
    {
      icon: Search,
      title: 'Appear in Search Results',
      description: 'Get discovered by property managers searching for your services across our network',
      included: isPremium || isBasic,
      premium: false,
    },
    {
      icon: Globe,
      title: 'Cross-Platform Visibility',
      description: 'Your profile is showcased on partner websites and industry directories',
      included: isPremium,
      premium: true,
    },
    {
      icon: Shield,
      title: 'Verified & Trusted Badge',
      description: 'Stand out with a verification badge that builds instant credibility',
      included: isVerified,
      premium: false,
      requiresVerification: true,
    },
    {
      icon: Zap,
      title: 'Priority RFQ Access',
      description: 'Be the first to see and respond to high-value project opportunities',
      included: isPremium,
      premium: true,
    },
    {
      icon: Users,
      title: 'Direct Client Inquiries',
      description: 'Receive leads directly from property managers looking for vendors',
      included: isPremium || isBasic,
      premium: false,
    },
    {
      icon: Star,
      title: 'Featured Marketplace Placement',
      description: 'Get prominently featured in the vendor marketplace and category listings',
      included: isPremium,
      premium: true,
    },
    {
      icon: TrendingUp,
      title: 'Profile Analytics',
      description: 'Track profile views, search appearances, and engagement metrics',
      included: isPremium || isBasic,
      premium: false,
    },
    {
      icon: Trophy,
      title: 'Top Vendor Recognition',
      description: 'Earn Top Vendor status and badges based on performance and reviews',
      included: isPremium,
      premium: true,
    },
  ];

  const includedBenefits = benefits.filter(b => b.included);
  const lockedBenefits = benefits.filter(b => !b.included);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-warning/10 to-success/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-warning" />
              Boost Your Visibility
            </CardTitle>
            <CardDescription>
              Complete your profile and upgrade to unlock powerful features
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Active Benefits */}
        {includedBenefits.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" />
              Your Active Benefits
            </h4>
            <div className="grid gap-3">
              {includedBenefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
                  >
                    <div className="p-2 rounded-full bg-success/10">
                      <Icon className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Benefits */}
        {lockedBenefits.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Unlock More Benefits
            </h4>
            <div className="grid gap-2">
              {lockedBenefits.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div 
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 opacity-75"
                  >
                    <div className="p-2 rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{benefit.title}</p>
                        {benefit.premium && (
                          <Badge variant="outline" className="text-xs py-0">Premium</Badge>
                        )}
                        {benefit.requiresVerification && (
                          <Badge variant="outline" className="text-xs py-0">Requires Verification</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        {!isPremium && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {!isBasic && (
              <Button 
                className="flex-1"
                onClick={() => navigate('/vendor/subscription')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade to Basic
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            <Button 
              variant={isBasic ? "default" : "outline"}
              className="flex-1"
              onClick={() => navigate('/vendor/subscription')}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Go Premium
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {!isVerified && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/vendor/verification')}
          >
            <Shield className="h-4 w-4 mr-2" />
            Get Verified for Free
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
