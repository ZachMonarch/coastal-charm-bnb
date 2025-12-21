import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BidFormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  sectionId: string;
  children: ReactNode;
  className?: string;
}

export default function BidFormSection({
  title,
  description,
  icon,
  sectionId,
  children,
  className
}: BidFormSectionProps) {
  return (
    <Card id={sectionId} className={cn("scroll-mt-24", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
