
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveLayout({ children, className }: ResponsiveLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5",
      "dark:from-background dark:via-background dark:to-primary/10",
      "transition-colors duration-300",
      className
    )}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </div>
    </div>
  );
}
