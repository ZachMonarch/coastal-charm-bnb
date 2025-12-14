import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Circle, Building2, Phone, MapPin, Briefcase, 
  Award, Shield, CreditCard, Image, FileText, ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileCompletenessProps {
  profile: {
    company_name?: string;
    phone?: string;
    address?: string;
    description?: string;
    specialties?: string[];
    service_areas?: string[];
    certifications?: string[];
    avatar_url?: string;
    is_verified?: boolean;
    insurance_verified?: boolean;
    background_check_verified?: boolean;
  } | null;
  hasPaymentMethod?: boolean;
  hasPayoutSettings?: boolean;
  portfolioCount?: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  weight: number;
  icon: React.ElementType;
  actionLabel: string;
  actionPath: string;
}

export default function VendorProfileCompleteness({ 
  profile, 
  hasPaymentMethod = false, 
  hasPayoutSettings = false,
  portfolioCount = 0 
}: ProfileCompletenessProps) {
  const navigate = useNavigate();

  const checklist: ChecklistItem[] = [
    {
      id: 'company_name',
      label: 'Company Name',
      description: 'Add your business name',
      completed: !!profile?.company_name,
      weight: 10,
      icon: Building2,
      actionLabel: 'Add Name',
      actionPath: '/vendor/showcase',
    },
    {
      id: 'phone',
      label: 'Phone Number',
      description: 'Add contact phone',
      completed: !!profile?.phone,
      weight: 10,
      icon: Phone,
      actionLabel: 'Add Phone',
      actionPath: '/vendor/showcase',
    },
    {
      id: 'address',
      label: 'Business Address',
      description: 'Add your location',
      completed: !!profile?.address,
      weight: 10,
      icon: MapPin,
      actionLabel: 'Add Address',
      actionPath: '/vendor/showcase',
    },
    {
      id: 'description',
      label: 'Business Description',
      description: 'Describe your services',
      completed: !!profile?.description && profile.description.length > 50,
      weight: 10,
      icon: FileText,
      actionLabel: 'Add Description',
      actionPath: '/vendor/showcase',
    },
    {
      id: 'specialties',
      label: 'Specialties',
      description: 'List your service specialties',
      completed: (profile?.specialties?.length || 0) >= 1,
      weight: 10,
      icon: Briefcase,
      actionLabel: 'Add Specialties',
      actionPath: '/vendor/showcase',
    },
    {
      id: 'service_areas',
      label: 'Service Areas',
      description: 'Define your coverage areas',
      completed: (profile?.service_areas?.length || 0) >= 1,
      weight: 10,
      icon: MapPin,
      actionLabel: 'Add Areas',
      actionPath: '/vendor/showcase',
    },
    {
      id: 'certifications',
      label: 'Certifications',
      description: 'Add your licenses & certs',
      completed: (profile?.certifications?.length || 0) >= 1,
      weight: 5,
      icon: Award,
      actionLabel: 'Add Certs',
      actionPath: '/vendor/showcase',
    },
    {
      id: 'avatar',
      label: 'Profile Photo',
      description: 'Upload company logo',
      completed: !!profile?.avatar_url,
      weight: 5,
      icon: Image,
      actionLabel: 'Upload Photo',
      actionPath: '/vendor/profile',
    },
    {
      id: 'portfolio',
      label: 'Portfolio Items',
      description: 'Showcase your past work',
      completed: portfolioCount >= 1,
      weight: 10,
      icon: Image,
      actionLabel: 'Add Portfolio',
      actionPath: '/vendor/documents', // Redirect to documents for now
    },
    {
      id: 'payment_method',
      label: 'Payment Method',
      description: 'Add payment for subscriptions',
      completed: hasPaymentMethod,
      weight: 5,
      icon: CreditCard,
      actionLabel: 'Add Payment',
      actionPath: '/vendor/subscription',
    },
    {
      id: 'payout_settings',
      label: 'Payout Settings',
      description: 'Configure how you get paid',
      completed: hasPayoutSettings,
      weight: 5,
      icon: CreditCard,
      actionLabel: 'Setup Payouts',
      actionPath: '/vendor/payout-settings',
    },
    {
      id: 'verified',
      label: 'Profile Verified',
      description: 'Complete verification process',
      completed: !!profile?.is_verified,
      weight: 5,
      icon: Shield,
      actionLabel: 'Get Verified',
      actionPath: '/vendor/documents', // Upload verification docs here
    },
    {
      id: 'insurance',
      label: 'Insurance Verified',
      description: 'Upload insurance documents',
      completed: !!profile?.insurance_verified,
      weight: 5,
      icon: Shield,
      actionLabel: 'Verify Insurance',
      actionPath: '/vendor/documents', // Upload insurance docs here
    },
  ];

  const completedWeight = checklist
    .filter(item => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);

  const totalWeight = checklist.reduce((sum, item) => sum + item.weight, 0);
  const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

  const incompleteItems = checklist.filter(item => !item.completed);
  const completedItems = checklist.filter(item => item.completed);

  const getCompletionColor = () => {
    if (completionPercentage >= 80) return 'text-success';
    if (completionPercentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getCompletionBadge = () => {
    if (completionPercentage >= 90) return { label: 'Excellent', variant: 'default' as const, className: 'bg-success text-success-foreground' };
    if (completionPercentage >= 70) return { label: 'Good', variant: 'secondary' as const, className: 'bg-primary/20 text-primary' };
    if (completionPercentage >= 50) return { label: 'Needs Work', variant: 'secondary' as const, className: 'bg-warning/20 text-warning' };
    return { label: 'Incomplete', variant: 'destructive' as const, className: '' };
  };

  const badge = getCompletionBadge();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Profile Completeness
              <Badge className={badge.className}>{badge.label}</Badge>
            </CardTitle>
            <CardDescription>Complete your profile to attract more clients</CardDescription>
          </div>
          <div className={`text-3xl font-bold ${getCompletionColor()}`}>
            {completionPercentage}%
          </div>
        </div>
        <Progress value={completionPercentage} className="h-2 mt-4" />
      </CardHeader>
      <CardContent className="space-y-4">
        {incompleteItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">To Complete</h4>
            <div className="grid gap-2">
              {incompleteItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => navigate(item.actionPath)}
                    >
                      {item.actionLabel}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                );
              })}
            </div>
            {incompleteItems.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                +{incompleteItems.length - 5} more items to complete
              </p>
            )}
          </div>
        )}

        {completedItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Completed ({completedItems.length}/{checklist.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {completedItems.map((item) => (
                <Badge key={item.id} variant="secondary" className="gap-1 bg-success/10 text-success border-success/30">
                  <CheckCircle2 className="h-3 w-3" />
                  {item.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
