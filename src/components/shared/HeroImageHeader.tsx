import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface HeroImageHeaderProps {
  title: string;
  description?: string;
  imageSrc: string;
  icon?: LucideIcon;
  className?: string;
  overlay?: 'dark' | 'light' | 'gradient';
  height?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export default function HeroImageHeader({
  title,
  description,
  imageSrc,
  icon: Icon,
  className,
  overlay = 'gradient',
  height = 'md',
  children
}: HeroImageHeaderProps) {
  const heightClasses = {
    sm: 'h-32 sm:h-40',
    md: 'h-40 sm:h-52',
    lg: 'h-52 sm:h-72'
  };

  const overlayClasses = {
    dark: 'bg-black/60',
    light: 'bg-white/40',
    gradient: 'bg-gradient-to-r from-background/90 via-background/70 to-background/50'
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-xl overflow-hidden',
        heightClasses[height],
        className
      )}
    >
      {/* Background Image */}
      <img
        src={imageSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />

      {/* Overlay */}
      <div className={cn('absolute inset-0', overlayClasses[overlay])} />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
              {description}
            </p>
          )}
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}