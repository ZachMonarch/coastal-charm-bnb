import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ReusableAvatarProps {
  url?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  variant?: 'default' | 'vendor' | 'user';
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
  xxl: 'h-20 w-20'
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
  xl: 'text-lg',
  xxl: 'text-xl'
};

const getInitials = (name: string): string => {
  if (!name || !name.trim()) return 'U';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const getVariantClasses = (variant: 'default' | 'vendor' | 'user') => {
  switch (variant) {
    case 'vendor':
      return 'bg-success/10 text-success border-success/30';
    case 'user':
      return 'bg-info/10 text-info border-info/30';
    default:
      return 'bg-primary/10 text-primary';
  }
};

export default function ReusableAvatar({ 
  url, 
  name, 
  size = 'md', 
  className,
  variant = 'default'
}: ReusableAvatarProps) {
  const initials = getInitials(name);
  const variantClasses = getVariantClasses(variant);
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={url || undefined} 
        alt={`${name} avatar`}
        className="object-cover"
      />
      <AvatarFallback 
        className={cn(
          'font-semibold select-none',
          textSizeClasses[size],
          variantClasses
        )}
        aria-label={`${name} avatar fallback`}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}