import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  previousValue?: number;
  format?: 'number' | 'currency' | 'percentage';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  color?: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
  className?: string;
  animated?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  previousValue,
  format = 'number',
  icon,
  trend,
  trendValue,
  color = 'primary',
  className,
  animated = true,
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  // Animate counter
  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animated]);

  // Calculate trend if not provided
  const calculatedTrend = trend || (previousValue !== undefined 
    ? value > previousValue ? 'up' : value < previousValue ? 'down' : 'neutral'
    : undefined);

  const calculatedTrendValue = trendValue ?? (previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : undefined);

  // Format value based on type
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  // Color variants
  const colorVariants = {
    primary: 'from-primary/10 to-primary/5 border-primary/20',
    success: 'from-success/10 to-success/5 border-success/20',
    warning: 'from-warning/10 to-warning/5 border-warning/20',
    info: 'from-info/10 to-info/5 border-info/20',
    destructive: 'from-destructive/10 to-destructive/5 border-destructive/20',
  };

  const iconColorVariants = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card 
      className={cn(
        'relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg',
        `bg-gradient-to-br ${colorVariants[color]}`,
        'card-hover-lift',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight animate-count-up">
              {formatValue(displayValue)}
            </p>
            {calculatedTrend && calculatedTrendValue !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                calculatedTrend === 'up' && 'text-success',
                calculatedTrend === 'down' && 'text-destructive',
                calculatedTrend === 'neutral' && 'text-muted-foreground'
              )}>
                {calculatedTrend === 'up' && <TrendingUp className="h-4 w-4" />}
                {calculatedTrend === 'down' && <TrendingDown className="h-4 w-4" />}
                {calculatedTrend === 'neutral' && <Minus className="h-4 w-4" />}
                <span>
                  {calculatedTrendValue > 0 ? '+' : ''}
                  {calculatedTrendValue.toFixed(1)}%
                </span>
                <span className="text-muted-foreground font-normal">vs prev</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'p-3 rounded-xl',
              iconColorVariants[color]
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5 pointer-events-none" />
    </Card>
  );
};

export default KPICard;
