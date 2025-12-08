import React from 'react';
import * as Progress from '@radix-ui/react-progress';
import { cn } from '../lib/utils';

export interface ProgressIndicatorProps {
  /** Current progress value between 0-100 */
  value: number;
  /** Size variant of the progress bar */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the progress label */
  showLabel?: boolean;
  /** Optional className for styling */
  className?: string;
}

export const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ value, size = 'medium', showLabel = true, className }, ref) => {
    const sizeClasses = {
      small: 'h-2',
      medium: 'h-4',
      large: 'h-6'
    };

    return (
      <div className="w-full space-y-2">
        <Progress.Root
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-full bg-secondary",
            sizeClasses[size],
            className
          )}
          style={{
            transform: 'translateZ(0)'
          }}
          value={value}
        >
          <Progress.Indicator
            className="h-full w-full flex-1 bg-primary transition-all"
            style={{ transform: `translateX(-${100 - value}%)` }}
          />
        </Progress.Root>
        {showLabel && (
          <div className="text-sm text-muted-foreground">
            {Math.round(value)}%
          </div>
        )}
      </div>
    );
  }
);

ProgressIndicator.displayName = 'ProgressIndicator';