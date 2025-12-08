import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Sparkles, Star, Zap, Crown, Shield, TrendingUp } from 'lucide-react';
import ColorfulIconBox from './ColorfulIconBox';

type ColorVariant = 'primary' | 'success' | 'warning' | 'info' | 'secondary';
type PatternType = 'dots' | 'lines' | 'circles' | 'none';

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: ColorVariant;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface DecorativeHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon;
  color?: ColorVariant;
  pattern?: PatternType;
  stats?: StatItem[];
  badge?: string;
  actions?: React.ReactNode;
  showFloatingIcons?: boolean;
  showGradientBorder?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const colorStyles: Record<ColorVariant, {
  bg: string;
  border: string;
  text: string;
  accent: string;
  glow: string;
}> = {
  primary: {
    bg: 'bg-gradient-to-br from-primary/20 via-primary/10 to-background',
    border: 'border-primary/30',
    text: 'text-primary',
    accent: 'bg-primary/20',
    glow: 'shadow-primary/20',
  },
  success: {
    bg: 'bg-gradient-to-br from-success/20 via-success/10 to-background',
    border: 'border-success/30',
    text: 'text-success',
    accent: 'bg-success/20',
    glow: 'shadow-success/20',
  },
  warning: {
    bg: 'bg-gradient-to-br from-warning/20 via-warning/10 to-background',
    border: 'border-warning/30',
    text: 'text-warning',
    accent: 'bg-warning/20',
    glow: 'shadow-warning/20',
  },
  info: {
    bg: 'bg-gradient-to-br from-info/20 via-info/10 to-background',
    border: 'border-info/30',
    text: 'text-info',
    accent: 'bg-info/20',
    glow: 'shadow-info/20',
  },
  secondary: {
    bg: 'bg-gradient-to-br from-secondary/30 via-secondary/15 to-background',
    border: 'border-secondary/30',
    text: 'text-secondary-foreground',
    accent: 'bg-secondary/20',
    glow: 'shadow-secondary/20',
  },
};

const patternOverlays: Record<PatternType, string> = {
  dots: `before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] before:bg-[size:20px_20px] before:opacity-[0.03]`,
  lines: `before:absolute before:inset-0 before:bg-[linear-gradient(45deg,currentColor_1px,transparent_1px)] before:bg-[size:16px_16px] before:opacity-[0.03]`,
  circles: `before:absolute before:inset-0 before:bg-[radial-gradient(circle,currentColor_1px,transparent_8px)] before:bg-[size:32px_32px] before:opacity-[0.03]`,
  none: '',
};

const floatingIcons = [
  { Icon: Sparkles, position: 'top-4 right-8', delay: '0s', size: 'sm' },
  { Icon: Star, position: 'top-12 right-24', delay: '0.5s', size: 'xs' },
  { Icon: Zap, position: 'bottom-6 right-16', delay: '1s', size: 'xs' },
  { Icon: Crown, position: 'top-8 left-[60%]', delay: '1.5s', size: 'xs' },
];

const sizeStyles: Record<string, { title: string; subtitle: string; padding: string }> = {
  sm: { title: 'text-xl', subtitle: 'text-sm', padding: 'p-4' },
  md: { title: 'text-2xl md:text-3xl', subtitle: 'text-base', padding: 'p-6' },
  lg: { title: 'text-3xl md:text-4xl', subtitle: 'text-lg', padding: 'p-8' },
};

export default function DecorativeHeader({
  title,
  subtitle,
  description,
  icon,
  color = 'primary',
  pattern = 'dots',
  stats,
  badge,
  actions,
  showFloatingIcons = true,
  showGradientBorder = true,
  size = 'md',
  className,
}: DecorativeHeaderProps) {
  const styles = colorStyles[color];
  const sizing = sizeStyles[size];

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Main header container */}
      <div
        className={cn(
          'relative rounded-2xl border',
          styles.bg,
          styles.border,
          showGradientBorder && `shadow-lg ${styles.glow}`,
          sizing.padding,
          pattern !== 'none' && patternOverlays[pattern]
        )}
      >
        {/* Animated gradient border effect */}
        {showGradientBorder && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className={cn(
              'absolute -inset-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent',
              'animate-[shimmer_3s_ease-in-out_infinite]'
            )} />
          </div>
        )}

        {/* Floating decorative icons */}
        {showFloatingIcons && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {floatingIcons.map(({ Icon: FloatIcon, position, delay, size: iconSize }, index) => (
              <div
                key={index}
                className={cn(
                  'absolute opacity-20 animate-pulse',
                  position,
                  styles.text
                )}
                style={{ animationDelay: delay, animationDuration: '3s' }}
              >
                <FloatIcon className={iconSize === 'xs' ? 'h-3 w-3' : 'h-4 w-4'} />
              </div>
            ))}
          </div>
        )}

        {/* Content layout */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Title section */}
          <div className="flex items-start gap-4">
            {/* Icon container */}
            {icon && (
              <ColorfulIconBox
                icon={icon}
                color={color}
                size="lg"
                variant="gradient"
                glow
              />
            )}

            <div className="space-y-1">
              {/* Badge */}
              {badge && (
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-2',
                  styles.accent,
                  styles.text
                )}>
                  <Sparkles className="h-3 w-3" />
                  {badge}
                </span>
              )}

              {/* Title */}
              <h1 className={cn(
                'font-bold tracking-tight text-foreground',
                sizing.title
              )}>
                {title}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p className={cn(
                  'font-medium',
                  styles.text,
                  sizing.subtitle
                )}>
                  {subtitle}
                </p>
              )}

              {/* Description */}
              {description && (
                <p className="text-muted-foreground text-sm max-w-xl mt-2">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          {actions && (
            <div className="flex items-center gap-3 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Stats ribbon */}
        {stats && stats.length > 0 && (
          <div className="relative z-10 mt-6 pt-6 border-t border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl',
                    'bg-background/50 backdrop-blur-sm border border-border/50',
                    'transition-all duration-300 hover:shadow-md hover:border-primary/30',
                    'group'
                  )}
                >
                  {stat.icon && (
                    <ColorfulIconBox
                      icon={stat.icon}
                      color={stat.color || 'primary'}
                      size="sm"
                      variant="glass"
                    />
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">{stat.value}</span>
                      {stat.trend && stat.trendValue && (
                        <span className={cn(
                          'text-xs font-medium flex items-center gap-0.5',
                          stat.trend === 'up' && 'text-success',
                          stat.trend === 'down' && 'text-destructive',
                          stat.trend === 'neutral' && 'text-muted-foreground'
                        )}>
                          {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                          {stat.trendValue}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
