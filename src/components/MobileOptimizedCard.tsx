
import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileOptimizedCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export default function MobileOptimizedCard({ 
  title, 
  description, 
  children, 
  className,
  headerAction 
}: MobileOptimizedCardProps) {
  return (
    <Card className={cn(
      "neumorphic-card w-full",
      "transition-all duration-300 hover:shadow-lg",
      "border-0 bg-card/50 backdrop-blur-sm",
      className
    )}>
      {(title || description || headerAction) && (
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5">
              {title && (
                <CardTitle className="text-lg sm:text-xl lg:text-2xl">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-sm sm:text-base">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerAction && (
              <div className="flex-shrink-0">
                {headerAction}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
}
