import React from 'react';
import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
type SpinnerColor = 'primary' | 'secondary' | 'foreground' | 'muted' | 'current';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

const colorClasses: Record<SpinnerColor, string> = {
  primary: 'border-primary border-t-transparent',
  secondary: 'border-secondary border-t-transparent',
  foreground: 'border-foreground border-t-transparent',
  muted: 'border-muted-foreground border-t-transparent',
  current: 'border-current border-t-transparent',
};

export default function LoadingSpinner({
  size = 'sm',
  color = 'current',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

// Also export inline spinner for button usage
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
