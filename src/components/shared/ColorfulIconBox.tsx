import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ColorVariant = 'primary' | 'success' | 'warning' | 'info' | 'secondary' | 'error';
type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AnimationVariant = 'none' | 'pulse' | 'glow' | 'bounce';

interface ColorfulIconBoxProps {
  icon: LucideIcon;
  color?: ColorVariant;
  size?: SizeVariant;
  className?: string;
  glow?: boolean;
  animation?: AnimationVariant;
  variant?: 'default' | 'gradient' | 'glass' | 'solid';
}

const colorClasses: Record<ColorVariant, {
  default: string;
  gradient: string;
  glass: string;
  solid: string;
  glow: string;
}> = {
  primary: {
    default: 'bg-primary/20 text-primary',
    gradient: 'bg-gradient-to-br from-primary/40 to-primary/15 text-primary',
    glass: 'bg-primary/10 backdrop-blur-sm border border-primary/30 text-primary',
    solid: 'bg-primary text-primary-foreground',
    glow: 'shadow-primary/40',
  },
  success: {
    default: 'bg-success/20 text-success',
    gradient: 'bg-gradient-to-br from-success/40 to-success/15 text-success',
    glass: 'bg-success/10 backdrop-blur-sm border border-success/30 text-success',
    solid: 'bg-success text-white',
    glow: 'shadow-success/40',
  },
  warning: {
    default: 'bg-warning/20 text-warning',
    gradient: 'bg-gradient-to-br from-warning/40 to-warning/15 text-warning',
    glass: 'bg-warning/10 backdrop-blur-sm border border-warning/30 text-warning',
    solid: 'bg-warning text-white',
    glow: 'shadow-warning/40',
  },
  info: {
    default: 'bg-info/20 text-info',
    gradient: 'bg-gradient-to-br from-info/40 to-info/15 text-info',
    glass: 'bg-info/10 backdrop-blur-sm border border-info/30 text-info',
    solid: 'bg-info text-white',
    glow: 'shadow-info/40',
  },
  secondary: {
    default: 'bg-secondary/30 text-secondary-foreground',
    gradient: 'bg-gradient-to-br from-secondary/50 to-secondary/20 text-secondary-foreground',
    glass: 'bg-secondary/15 backdrop-blur-sm border border-secondary/30 text-secondary-foreground',
    solid: 'bg-secondary text-secondary-foreground',
    glow: 'shadow-secondary/40',
  },
  error: {
    default: 'bg-destructive/20 text-destructive',
    gradient: 'bg-gradient-to-br from-destructive/40 to-destructive/15 text-destructive',
    glass: 'bg-destructive/10 backdrop-blur-sm border border-destructive/30 text-destructive',
    solid: 'bg-destructive text-destructive-foreground',
    glow: 'shadow-destructive/40',
  },
};

const sizeClasses: Record<SizeVariant, { box: string; icon: string }> = {
  xs: { box: 'p-1.5 rounded-md', icon: 'h-3 w-3' },
  sm: { box: 'p-2 rounded-lg', icon: 'h-4 w-4' },
  md: { box: 'p-2.5 rounded-xl', icon: 'h-5 w-5' },
  lg: { box: 'p-3.5 rounded-xl', icon: 'h-6 w-6' },
  xl: { box: 'p-4 rounded-2xl', icon: 'h-8 w-8' },
};

const animationClasses: Record<AnimationVariant, string> = {
  none: '',
  pulse: 'animate-pulse',
  glow: 'animate-[pulse_2s_ease-in-out_infinite]',
  bounce: 'animate-bounce',
};

export default function ColorfulIconBox({
  icon: Icon,
  color = 'primary',
  size = 'md',
  className = '',
  glow = false,
  animation = 'none',
  variant = 'gradient',
}: ColorfulIconBoxProps) {
  const colorStyle = colorClasses[color];
  const sizeStyle = sizeClasses[size];

  return (
    <div className="relative group">
      {/* Glow effect behind the icon */}
      {glow && (
        <div 
          className={cn(
            'absolute inset-0 rounded-xl blur-lg opacity-60 transition-all duration-300 group-hover:opacity-80 group-hover:blur-xl',
            colorStyle.glow.replace('shadow-', 'bg-').replace('/40', '/30')
          )} 
        />
      )}
      
      <div
        className={cn(
          'relative',
          colorStyle[variant],
          sizeStyle.box,
          glow && `shadow-lg ${colorStyle.glow}`,
          animationClasses[animation],
          'transition-all duration-300 hover:scale-110',
          className
        )}
      >
        <Icon className={cn(sizeStyle.icon, 'relative z-10')} />
      </div>
    </div>
  );
}
