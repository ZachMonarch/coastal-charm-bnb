import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface VendorActionCardProps {
  title: string;
  description: string;
  route: string;
  icon: LucideIcon;
  count?: number;
  urgencyLevel?: 'low' | 'medium' | 'high';
  className?: string;
  disabled?: boolean;
  badge?: string;
}

export default function VendorActionCard({
  title,
  description,
  route,
  icon: Icon,
  count,
  urgencyLevel = 'low',
  className,
  disabled = false,
  badge
}: VendorActionCardProps) {
  const getUrgencyStyles = () => {
    switch (urgencyLevel) {
      case 'high': return 'border-destructive/20 hover:border-destructive/40 bg-destructive/5';
      case 'medium': return 'border-warning/20 hover:border-warning/40 bg-warning/5';
      default: return 'border-primary/20 hover:border-primary/40 bg-primary/5';
    }
  };

  const getCountStyles = () => {
    switch (urgencyLevel) {
      case 'high': return 'bg-destructive text-destructive-foreground font-bold';
      case 'medium': return 'bg-warning text-warning-foreground font-bold';
      default: return 'bg-primary text-primary-foreground font-bold';
    }
  };

  if (disabled) {
    return (
      <div>
      <Card className={cn(
        'transition-all duration-200 hover:shadow-lg cursor-pointer group relative overflow-hidden',
        getUrgencyStyles(),
        disabled && 'opacity-50 cursor-not-allowed hover:shadow-none',
        className
      )}>
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={cn(
                "p-3 rounded-xl transition-colors duration-200",
                urgencyLevel === 'high' && "bg-destructive/10 text-destructive",
                urgencyLevel === 'medium' && "bg-warning/10 text-warning",
                urgencyLevel === 'low' && "bg-primary/10 text-primary"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {badge && (
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            
            {(count !== undefined && count > 0) && (
              <Badge 
                className={cn(
                  "ml-2 min-w-[24px] h-6 flex items-center justify-center text-xs font-bold",
                  getCountStyles()
                )}
              >
                {count > 99 ? '99+' : count}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <Link to={route}>
      <Card className={cn(
        'transition-all duration-200 hover:shadow-lg cursor-pointer group relative overflow-hidden',
        getUrgencyStyles(),
        className
      )}>
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={cn(
                "p-3 rounded-xl transition-colors duration-200",
                urgencyLevel === 'high' && "bg-destructive/10 text-destructive",
                urgencyLevel === 'medium' && "bg-warning/10 text-warning",
                urgencyLevel === 'low' && "bg-primary/10 text-primary"
              )}>
                <Icon className="h-6 w-6" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  {badge && (
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            
            {(count !== undefined && count > 0) && (
              <Badge 
                className={cn(
                  "ml-2 min-w-[24px] h-6 flex items-center justify-center text-xs font-bold",
                  getCountStyles()
                )}
              >
                {count > 99 ? '99+' : count}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}