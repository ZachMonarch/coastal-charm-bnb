import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface HeroImageHeaderProps {
  title: string;
  description?: string;
  imageSrc: string;
  icon?: LucideIcon;
  className?: string;
  overlay?: 'dark' | 'light' | 'gradient' | 'brand';
  height?: 'sm' | 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
  align?: 'left' | 'center';
}

export default function HeroImageHeader({
  title,
  description,
  imageSrc,
  icon: Icon,
  className,
  overlay = 'gradient',
  height = 'md',
  children,
  align = 'left'
}: HeroImageHeaderProps) {
  const heightClasses = {
    sm: 'h-32 sm:h-40',
    md: 'h-40 sm:h-52',
    lg: 'h-52 sm:h-72',
    xl: 'h-64 sm:h-96'
  };

  const overlayClasses = {
    dark: 'bg-black/60',
    light: 'bg-white/40',
    gradient: 'bg-gradient-to-r from-background/90 via-background/70 to-background/50',
    brand: 'bg-gradient-to-r from-primary/80 via-primary/60 to-transparent'
  };

  const alignClasses = {
    left: 'justify-center items-start text-left',
    center: 'justify-center items-center text-center'
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
        onError={(e) => {
          // Fallback to a gradient if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />

      {/* Overlay */}
      <div className={cn('absolute inset-0', overlayClasses[overlay])} />

      {/* Content */}
      <div className={cn(
        'relative z-10 h-full flex flex-col px-6 sm:px-8',
        alignClasses[align]
      )}>
        <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
          <div className={cn(
            'flex items-center gap-3 mb-2',
            align === 'center' && 'justify-center'
          )}>
            {Icon && (
              <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            )}
            <h1 className={cn(
              'text-2xl sm:text-3xl font-bold',
              overlay === 'brand' ? 'text-primary-foreground' : 'text-foreground'
            )}>
              {title}
            </h1>
          </div>
          {description && (
            <p className={cn(
              'text-sm sm:text-base max-w-xl',
              overlay === 'brand' ? 'text-primary-foreground/90' : 'text-muted-foreground'
            )}>
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