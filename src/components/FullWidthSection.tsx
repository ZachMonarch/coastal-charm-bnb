import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FullWidthSectionProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  noPadding?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-none'
};

export default function FullWidthSection({ 
  children, 
  className, 
  maxWidth = '2xl',
  noPadding = false 
}: FullWidthSectionProps) {
  return (
    <section className={cn("w-full", className)}>
      <div className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth],
        !noPadding && "px-4 sm:px-6 lg:px-8"
      )}>
        {children}
      </div>
    </section>
  );
}
