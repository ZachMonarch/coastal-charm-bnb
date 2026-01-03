import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ColorVariant = 'primary' | 'success' | 'warning' | 'info' | 'secondary' | 'error';
type SizeVariant = 'sm' | 'md' | 'lg';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: ColorVariant;
  subtitle?: string;
  className?: string;
  size?: SizeVariant;
  animated?: boolean;
  glowing?: boolean;
}

const colorConfig: Record<ColorVariant, { 
  bg: string; 
  iconBg: string; 
  border: string;
  gradient: string;
  glow: string;
  ring: string;
}> = {
  primary: {
    bg: 'from-primary/25 via-primary/10 to-background',
    iconBg: 'bg-gradient-to-br from-primary/30 to-primary/10 text-primary shadow-lg shadow-primary/20',
    border: 'border-primary/30 hover:border-primary/50',
    gradient: 'from-primary to-primary/70',
    glow: 'hover:shadow-lg hover:shadow-primary/20',
    ring: 'ring-primary/20',
  },
  success: {
    bg: 'from-success/25 via-success/10 to-background',
    iconBg: 'bg-gradient-to-br from-success/30 to-success/10 text-success shadow-lg shadow-success/20',
    border: 'border-success/30 hover:border-success/50',
    gradient: 'from-success to-success/70',
    glow: 'hover:shadow-lg hover:shadow-success/20',
    ring: 'ring-success/20',
  },
  warning: {
    bg: 'from-warning/25 via-warning/10 to-background',
    iconBg: 'bg-gradient-to-br from-warning/30 to-warning/10 text-warning shadow-lg shadow-warning/20',
    border: 'border-warning/30 hover:border-warning/50',
    gradient: 'from-warning to-warning/70',
    glow: 'hover:shadow-lg hover:shadow-warning/20',
    ring: 'ring-warning/20',
  },
  info: {
    bg: 'from-info/25 via-info/10 to-background',
    iconBg: 'bg-gradient-to-br from-info/30 to-info/10 text-info shadow-lg shadow-info/20',
    border: 'border-info/30 hover:border-info/50',
    gradient: 'from-info to-info/70',
    glow: 'hover:shadow-lg hover:shadow-info/20',
    ring: 'ring-info/20',
  },
  secondary: {
    bg: 'from-secondary/25 via-secondary/10 to-background',
    iconBg: 'bg-gradient-to-br from-secondary/30 to-secondary/10 text-secondary-foreground shadow-lg shadow-secondary/20',
    border: 'border-secondary/30 hover:border-secondary/50',
    gradient: 'from-secondary to-secondary/70',
    glow: 'hover:shadow-lg hover:shadow-secondary/20',
    ring: 'ring-secondary/20',
  },
  error: {
    bg: 'from-destructive/25 via-destructive/10 to-background',
    iconBg: 'bg-gradient-to-br from-destructive/30 to-destructive/10 text-destructive shadow-lg shadow-destructive/20',
    border: 'border-destructive/30 hover:border-destructive/50',
    gradient: 'from-destructive to-destructive/70',
    glow: 'hover:shadow-lg hover:shadow-destructive/20',
    ring: 'ring-destructive/20',
  },
};

const sizeConfig: Record<SizeVariant, { padding: string; iconSize: string; valueSize: string; titleSize: string }> = {
  sm: { padding: 'p-4', iconSize: 'h-4 w-4', valueSize: 'text-xl', titleSize: 'text-xs' },
  md: { padding: 'p-5', iconSize: 'h-5 w-5', valueSize: 'text-2xl', titleSize: 'text-sm' },
  lg: { padding: 'p-6', iconSize: 'h-6 w-6', valueSize: 'text-3xl', titleSize: 'text-sm' },
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  subtitle,
  className = '',
  size = 'md',
  animated = true,
  glowing = true,
}: StatsCardProps) {
  const config = colorConfig[color];
  const sizeStyles = sizeConfig[size];

  return (
    <Card
      className={cn(
        'group relative overflow-hidden interactive-glow',
        `bg-gradient-to-br ${config.bg} ${config.border}`,
        'shadow-md transition-all duration-300 hover:-translate-y-1',
        // Dark mode enhanced visibility
        'dark:shadow-lg dark:shadow-black/20',
        glowing && config.glow,
        animated && 'animate-fade-in',
        className
      )}
    >
      {/* Decorative corner gradient */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, var(--${color === 'error' ? 'destructive' : color}) 0%, transparent 70%)`,
        }}
      />
      
      {/* Animated border glow on hover */}
      <div className={cn(
        'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
        `ring-2 ${config.ring}`
      )} />

      <CardContent className={sizeStyles.padding}>
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Icon with gradient background */}
            <div className={cn(
              'relative p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110',
              config.iconBg
            )}>
              {/* Icon glow effect */}
              <div className="absolute inset-0 rounded-xl blur-md opacity-50 bg-inherit" />
              <Icon className={cn('relative z-10', sizeStyles.iconSize)} />
            </div>
            
            <div className="space-y-0.5">
              <p className={cn('font-medium text-foreground/75', sizeStyles.titleSize)}>
                {title}
              </p>
              <p className={cn(
                'font-bold text-foreground transition-colors group-hover:text-primary',
                sizeStyles.valueSize
              )}>
                {value}
              </p>
              {subtitle && (
                <p className="text-xs text-foreground/60 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {trend && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
              trend.isPositive 
                ? 'text-success bg-success/15 shadow-sm shadow-success/10' 
                : 'text-destructive bg-destructive/15 shadow-sm shadow-destructive/10'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
