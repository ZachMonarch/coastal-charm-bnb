import React from 'react';
import { cn } from '@/lib/utils';

type PatternType = 'dots' | 'grid' | 'waves' | 'mesh' | 'none';
type GradientType = 'radial' | 'linear' | 'conic' | 'mesh';

interface EnhancedPageBackgroundProps {
  children: React.ReactNode;
  pattern?: PatternType;
  gradient?: GradientType;
  primaryColor?: 'primary' | 'success' | 'warning' | 'info' | 'secondary';
  intensity?: 'subtle' | 'medium' | 'vibrant';
  showOrbs?: boolean;
  showParticles?: boolean;
  className?: string;
}

const patternStyles: Record<PatternType, string> = {
  dots: `bg-[radial-gradient(circle_at_1px_1px,hsl(var(--primary)/0.15)_1px,transparent_0)] bg-[size:24px_24px]`,
  grid: `bg-[linear-gradient(hsl(var(--primary)/0.08)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.08)_1px,transparent_1px)] bg-[size:32px_32px]`,
  waves: `bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0C13.4 0 0 13.4 0 30s13.4 30 30 30 30-13.4 30-30S46.6 0 30 0zm0 50c-11 0-20-9-20-20s9-20 20-20 20 9 20 20-9 20-20 20z' fill='%23c9a227' fill-opacity='0.05'/%3E%3C/svg%3E")]`,
  mesh: '',
  none: '',
};

const gradientStyles: Record<GradientType, Record<string, string>> = {
  radial: {
    primary: 'bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.1),transparent_50%)]',
    success: 'bg-[radial-gradient(ellipse_at_top,hsl(var(--success)/0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--success)/0.1),transparent_50%)]',
    warning: 'bg-[radial-gradient(ellipse_at_top,hsl(var(--warning)/0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--warning)/0.1),transparent_50%)]',
    info: 'bg-[radial-gradient(ellipse_at_top,hsl(var(--info)/0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--info)/0.1),transparent_50%)]',
    secondary: 'bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.1),transparent_50%)]',
  },
  linear: {
    primary: 'bg-gradient-to-br from-primary/10 via-transparent to-primary/5',
    success: 'bg-gradient-to-br from-success/10 via-transparent to-success/5',
    warning: 'bg-gradient-to-br from-warning/10 via-transparent to-warning/5',
    info: 'bg-gradient-to-br from-info/10 via-transparent to-info/5',
    secondary: 'bg-gradient-to-br from-secondary/10 via-transparent to-secondary/5',
  },
  conic: {
    primary: 'bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--primary)/0.1),hsl(var(--background)),hsl(var(--primary)/0.1))]',
    success: 'bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--success)/0.1),hsl(var(--background)),hsl(var(--success)/0.1))]',
    warning: 'bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--warning)/0.1),hsl(var(--background)),hsl(var(--warning)/0.1))]',
    info: 'bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--info)/0.1),hsl(var(--background)),hsl(var(--info)/0.1))]',
    secondary: 'bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--secondary)/0.1),hsl(var(--background)),hsl(var(--secondary)/0.1))]',
  },
  mesh: {
    primary: 'bg-[radial-gradient(at_40%_20%,hsl(var(--primary)/0.2)_0px,transparent_50%),radial-gradient(at_80%_0%,hsl(var(--accent)/0.15)_0px,transparent_50%),radial-gradient(at_0%_50%,hsl(var(--primary)/0.1)_0px,transparent_50%),radial-gradient(at_80%_50%,hsl(var(--success)/0.1)_0px,transparent_50%),radial-gradient(at_0%_100%,hsl(var(--info)/0.1)_0px,transparent_50%)]',
    success: 'bg-[radial-gradient(at_40%_20%,hsl(var(--success)/0.2)_0px,transparent_50%),radial-gradient(at_80%_0%,hsl(var(--primary)/0.15)_0px,transparent_50%),radial-gradient(at_0%_50%,hsl(var(--success)/0.1)_0px,transparent_50%)]',
    warning: 'bg-[radial-gradient(at_40%_20%,hsl(var(--warning)/0.2)_0px,transparent_50%),radial-gradient(at_80%_0%,hsl(var(--primary)/0.15)_0px,transparent_50%),radial-gradient(at_0%_50%,hsl(var(--warning)/0.1)_0px,transparent_50%)]',
    info: 'bg-[radial-gradient(at_40%_20%,hsl(var(--info)/0.2)_0px,transparent_50%),radial-gradient(at_80%_0%,hsl(var(--primary)/0.15)_0px,transparent_50%),radial-gradient(at_0%_50%,hsl(var(--info)/0.1)_0px,transparent_50%)]',
    secondary: 'bg-[radial-gradient(at_40%_20%,hsl(var(--secondary)/0.2)_0px,transparent_50%),radial-gradient(at_80%_0%,hsl(var(--primary)/0.15)_0px,transparent_50%),radial-gradient(at_0%_50%,hsl(var(--secondary)/0.1)_0px,transparent_50%)]',
  },
};

const intensityOpacity: Record<string, string> = {
  subtle: 'opacity-50',
  medium: 'opacity-75',
  vibrant: 'opacity-100',
};

export default function EnhancedPageBackground({
  children,
  pattern = 'dots',
  gradient = 'mesh',
  primaryColor = 'primary',
  intensity = 'medium',
  showOrbs = true,
  showParticles = false,
  className,
}: EnhancedPageBackgroundProps) {
  return (
    <div className={cn('relative min-h-screen overflow-hidden', className)}>
      {/* Base gradient layer */}
      <div 
        className={cn(
          'absolute inset-0 -z-10',
          gradientStyles[gradient][primaryColor],
          intensityOpacity[intensity]
        )} 
      />
      
      {/* Pattern overlay */}
      {pattern !== 'none' && (
        <div 
          className={cn(
            'absolute inset-0 -z-10',
            patternStyles[pattern],
            intensityOpacity[intensity]
          )} 
        />
      )}
      
      {/* Floating orbs for depth */}
      {showOrbs && (
        <>
          {/* Top-left orb */}
          <div 
            className={cn(
              'absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl -z-10',
              'bg-primary/20 animate-pulse',
              intensityOpacity[intensity]
            )} 
            style={{ animationDuration: '4s' }}
          />
          
          {/* Top-right orb */}
          <div 
            className={cn(
              'absolute -top-48 right-0 w-80 h-80 rounded-full blur-3xl -z-10',
              'bg-accent/15 animate-pulse',
              intensityOpacity[intensity]
            )}
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          />
          
          {/* Bottom-left orb */}
          <div 
            className={cn(
              'absolute bottom-0 -left-24 w-72 h-72 rounded-full blur-3xl -z-10',
              'bg-success/10 animate-pulse',
              intensityOpacity[intensity]
            )}
            style={{ animationDuration: '5s', animationDelay: '2s' }}
          />
          
          {/* Center-right orb */}
          <div 
            className={cn(
              'absolute top-1/2 -right-32 w-64 h-64 rounded-full blur-3xl -z-10',
              'bg-info/10 animate-pulse',
              intensityOpacity[intensity]
            )}
            style={{ animationDuration: '7s', animationDelay: '0.5s' }}
          />
        </>
      )}
      
      {/* Subtle particles (optional) */}
      {showParticles && (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
