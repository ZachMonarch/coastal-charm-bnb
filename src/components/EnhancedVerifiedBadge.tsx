import { Shield, CheckCircle, Crown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EnhancedVerifiedBadgeProps {
  isVerified: boolean;
  tier?: 'basic' | 'premium' | 'enterprise';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export default function EnhancedVerifiedBadge({ 
  isVerified, 
  tier = 'basic',
  size = 'md', 
  showText = false,
  className,
  animated = true
}: EnhancedVerifiedBadgeProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4', 
    lg: 'h-5 w-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const getBadgeConfig = () => {
    if (!isVerified) {
      return {
        icon: Shield,
        text: 'Unverified',
        className: 'border-muted-foreground/30 text-muted-foreground bg-background',
        tooltipTitle: 'Unverified Vendor',
        tooltipDescription: 'Verification pending or incomplete'
      };
    }

    switch (tier) {
      case 'premium':
        return {
          icon: Crown,
          text: 'Premium Verified',
          className: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20',
          tooltipTitle: 'Premium Verified Vendor',
          tooltipDescription: 'Background check, insurance, certifications, and premium features verified'
        };
      case 'enterprise':
        return {
          icon: Crown,
          text: 'Elite Verified',
          className: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:bg-gradient-to-r hover:from-amber-500/20 hover:to-orange-500/20',
          tooltipTitle: 'Elite Verified Vendor',
          tooltipDescription: 'Highest tier verification with enterprise-grade security and compliance'
        };
      default:
        return {
          icon: CheckCircle,
          text: 'Verified',
          className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
          tooltipTitle: 'Basic Verified Vendor',
          tooltipDescription: 'Background check, insurance, and basic certifications verified'
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={cn(
              "cursor-help transition-all duration-200",
              animated && "hover:scale-105",
              config.className,
              className
            )}
          >
            <IconComponent 
              className={cn(
                sizeClasses[size], 
                showText && "mr-1",
                animated && isVerified && "animate-pulse"
              )} 
            />
            {showText && <span className={textSizes[size]}>{config.text}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{config.tooltipTitle}</p>
            <p className="text-xs text-muted-foreground">
              {config.tooltipDescription}
            </p>
            {isVerified && tier !== 'basic' && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-3 w-3 text-primary" />
                <span className="text-xs">Premium Features Enabled</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}