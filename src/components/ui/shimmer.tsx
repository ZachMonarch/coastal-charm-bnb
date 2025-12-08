import React from 'react';
import { cn } from '@/lib/utils';

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'avatar' | 'button';
}

const Shimmer = React.forwardRef<HTMLDivElement, ShimmerProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses = 'skeleton-shimmer animate-pulse rounded';
    
    const variantClasses = {
      default: 'h-4 w-full bg-muted',
      card: 'h-32 w-full bg-muted rounded-lg',
      text: 'h-4 w-full bg-muted',
      avatar: 'h-12 w-12 bg-muted rounded-full',
      button: 'h-10 w-24 bg-muted rounded-md',
    };

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

Shimmer.displayName = 'Shimmer';

// Enhanced shimmer with gradient animation
const ShimmerCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-lg bg-muted',
          className
        )}
        aria-hidden="true"
        {...props}
      >
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    );
  }
);

ShimmerCard.displayName = 'ShimmerCard';

// Skeleton loader with shimmer effect
const SkeletonShimmer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-md bg-muted',
          'before:absolute before:inset-0',
          'before:translate-x-[-100%]',
          'before:animate-[shimmer_1.5s_infinite]',
          'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

SkeletonShimmer.displayName = 'SkeletonShimmer';

export { Shimmer, ShimmerCard, SkeletonShimmer };
