import { Shield, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function VerifiedBadge({ 
  isVerified, 
  size = 'md', 
  showText = false,
  className 
}: VerifiedBadgeProps) {
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

  if (!isVerified) {
    return showText ? (
      <Badge variant="outline" className={cn("border-muted-foreground/30 text-muted-foreground", className)}>
        <Shield className={cn(sizeClasses[size], "mr-1")} />
        <span className={textSizes[size]}>Unverified</span>
      </Badge>
    ) : null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={cn(
              "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-help",
              className
            )}
          >
            <CheckCircle className={cn(sizeClasses[size], showText && "mr-1")} />
            {showText && <span className={textSizes[size]}>Verified</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Vendor</p>
          <p className="text-xs text-muted-foreground">
            Background check, insurance, and certifications verified
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}