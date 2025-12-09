import React from 'react';
import { LucideIcon, FileText, DollarSign, Briefcase, Users, Building2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStateType = 'documents' | 'payments' | 'projects' | 'users' | 'properties' | 'general';

interface EmptyStateIllustrationProps {
  type?: EmptyStateType;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const typeIcons: Record<EmptyStateType, LucideIcon> = {
  documents: FileText,
  payments: DollarSign,
  projects: Briefcase,
  users: Users,
  properties: Building2,
  general: Package,
};

const typeColors: Record<EmptyStateType, string> = {
  documents: 'from-info/20 to-info/5',
  payments: 'from-success/20 to-success/5',
  projects: 'from-primary/20 to-primary/5',
  users: 'from-warning/20 to-warning/5',
  properties: 'from-secondary/20 to-secondary/5',
  general: 'from-muted/30 to-muted/10',
};

export default function EmptyStateIllustration({
  type = 'general',
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateIllustrationProps) {
  const Icon = icon || typeIcons[type];
  const gradientColor = typeColors[type];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {/* Decorative Background */}
      <div className="relative mb-6">
        <div className={cn(
          'absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse',
          `bg-gradient-to-br ${gradientColor}`
        )} style={{ width: '120px', height: '120px', top: '-10px', left: '-10px' }} />
        
        {/* Icon Container */}
        <div className={cn(
          'relative w-24 h-24 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-card via-card to-muted/50',
          'border border-border/50 shadow-lg'
        )}>
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
        
        {/* Decorative Dots */}
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: '0.2s' }} />
        <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-accent/30 animate-bounce" style={{ animationDelay: '0.4s' }} />
      </div>

      {/* Text Content */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}

      {/* Action Button */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
