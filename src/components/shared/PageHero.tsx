import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeroStat {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'info' | 'secondary';
}

interface HeroCTA {
  label: string;
  href: string;
  variant?: 'default' | 'outline' | 'secondary';
}

interface PageHeroProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  stats?: HeroStat[];
  actions?: HeroCTA[];
  variant?: 'primary' | 'secondary' | 'gradient' | 'vibrant';
  children?: React.ReactNode;
  showDecorations?: boolean;
  className?: string;
}

const colorClasses = {
  primary: 'text-primary bg-primary/25 shadow-primary/30',
  success: 'text-success bg-success/25 shadow-success/30',
  warning: 'text-warning bg-warning/25 shadow-warning/30',
  info: 'text-info bg-info/25 shadow-info/30',
  secondary: 'text-secondary bg-secondary/25 shadow-secondary/30',
};

// Floating decorative icons for visual interest
function FloatingDecorations() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Gradient orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-info/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* Dot pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

export default function PageHero({
  title,
  description,
  icon: Icon,
  stats,
  actions,
  variant = 'gradient',
  children,
  showDecorations = true,
  className,
}: PageHeroProps) {
  const bgClasses = {
    primary: 'bg-gradient-to-br from-primary/25 via-primary/10 to-background border-primary/40',
    secondary: 'bg-gradient-to-br from-secondary/25 via-secondary/10 to-background border-secondary/40',
    gradient: 'bg-gradient-to-br from-primary/20 via-background to-secondary/15 border-primary/30',
    vibrant: 'bg-gradient-to-br from-primary/30 via-info/10 to-secondary/20 border-primary/40 shadow-lg shadow-primary/10',
  };

  return (
    <div 
      className={cn(
        'relative rounded-2xl border p-6 md:p-8 animate-fade-in overflow-hidden',
        bgClasses[variant],
        className
      )}
    >
      {/* Decorative elements */}
      {showDecorations && <FloatingDecorations />}

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title Section */}
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="relative group">
                {/* Glow effect behind icon */}
                <div className="absolute inset-0 bg-primary/40 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60" />
                <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {title}
                </h1>
                <Sparkles className="h-5 w-5 text-primary/60 animate-pulse hidden sm:block" />
              </div>
              {description && (
                <p className="text-foreground/75 max-w-2xl leading-relaxed">{description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  asChild
                  className={cn(
                    'shadow-md hover:shadow-lg transition-all duration-300',
                    action.variant === 'default' && 'shadow-primary/20 hover:shadow-primary/40'
                  )}
                >
                  <Link 
                    to={action.href}
                    className={action.variant === 'default' || !action.variant ? 'text-white' : undefined}
                  >
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 border border-transparent hover:border-border/50 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {stat.icon && (
                  <div className={cn(
                    'p-2.5 rounded-xl shadow-md transition-all duration-300 group-hover:scale-110',
                    colorClasses[stat.color || 'primary']
                  )}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Content */}
        {children}
      </div>
    </div>
  );
}
