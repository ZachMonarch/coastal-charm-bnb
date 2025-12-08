/**
 * Centralized icon color utilities for consistent brand-aligned coloring
 * These return Tailwind classes that use CSS variables from the design system
 */

export type IconColorType = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'muted'
  | 'gold'
  | 'teal'

export type IconContext = 
  | 'dashboard'
  | 'finance'
  | 'projects'
  | 'users'
  | 'documents'
  | 'settings'
  | 'notifications'
  | 'analytics'
  | 'status'

/**
 * Get icon color class based on semantic type
 */
export function getIconColorClass(type: IconColorType): string {
  const colorMap: Record<IconColorType, string> = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-destructive',
    info: 'text-info',
    muted: 'text-muted-foreground',
    gold: 'text-primary', // Monarch Gold
    teal: 'text-secondary', // Monarch Teal
  }
  return colorMap[type]
}

/**
 * Get icon background class (for icon boxes/containers)
 */
export function getIconBgClass(type: IconColorType): string {
  const bgMap: Record<IconColorType, string> = {
    primary: 'bg-primary/10 dark:bg-primary/20',
    secondary: 'bg-secondary/10 dark:bg-secondary/20',
    success: 'bg-success/10 dark:bg-success/20',
    warning: 'bg-warning/10 dark:bg-warning/20',
    error: 'bg-destructive/10 dark:bg-destructive/20',
    info: 'bg-info/10 dark:bg-info/20',
    muted: 'bg-muted',
    gold: 'bg-primary/10 dark:bg-primary/20',
    teal: 'bg-secondary/10 dark:bg-secondary/20',
  }
  return bgMap[type]
}

/**
 * Get combined icon container classes (background + text color)
 */
export function getIconContainerClasses(type: IconColorType): string {
  return `${getIconBgClass(type)} ${getIconColorClass(type)}`
}

/**
 * Get icon color based on context/feature area
 */
export function getContextIconColor(context: IconContext): IconColorType {
  const contextMap: Record<IconContext, IconColorType> = {
    dashboard: 'primary',
    finance: 'success',
    projects: 'info',
    users: 'secondary',
    documents: 'warning',
    settings: 'muted',
    notifications: 'error',
    analytics: 'primary',
    status: 'info',
  }
  return contextMap[context]
}

/**
 * Get status-based icon color
 */
export function getStatusIconColor(status: string): IconColorType {
  const statusMap: Record<string, IconColorType> = {
    // Success states
    completed: 'success',
    approved: 'success',
    active: 'success',
    verified: 'success',
    paid: 'success',
    
    // Warning states
    pending: 'warning',
    in_progress: 'warning',
    review: 'warning',
    awaiting: 'warning',
    
    // Error states
    rejected: 'error',
    failed: 'error',
    overdue: 'error',
    cancelled: 'error',
    expired: 'error',
    
    // Info states
    draft: 'info',
    submitted: 'info',
    new: 'info',
    
    // Default
    default: 'muted',
  }
  
  return statusMap[status.toLowerCase()] || 'muted'
}

/**
 * Get gradient classes for icon containers (for special emphasis)
 */
export function getIconGradientClass(type: IconColorType): string {
  const gradientMap: Record<IconColorType, string> = {
    primary: 'bg-gradient-to-br from-primary/20 to-primary/5',
    secondary: 'bg-gradient-to-br from-secondary/20 to-secondary/5',
    success: 'bg-gradient-to-br from-success/20 to-success/5',
    warning: 'bg-gradient-to-br from-warning/20 to-warning/5',
    error: 'bg-gradient-to-br from-destructive/20 to-destructive/5',
    info: 'bg-gradient-to-br from-info/20 to-info/5',
    muted: 'bg-gradient-to-br from-muted to-muted/50',
    gold: 'bg-gradient-to-br from-primary/20 to-primary/5',
    teal: 'bg-gradient-to-br from-secondary/20 to-secondary/5',
  }
  return gradientMap[type]
}

/**
 * Get glow/shadow class for icon containers
 */
export function getIconGlowClass(type: IconColorType): string {
  const glowMap: Record<IconColorType, string> = {
    primary: 'shadow-lg shadow-primary/20',
    secondary: 'shadow-lg shadow-secondary/20',
    success: 'shadow-lg shadow-success/20',
    warning: 'shadow-lg shadow-warning/20',
    error: 'shadow-lg shadow-destructive/20',
    info: 'shadow-lg shadow-info/20',
    muted: 'shadow-md',
    gold: 'shadow-lg shadow-primary/25',
    teal: 'shadow-lg shadow-secondary/25',
  }
  return glowMap[type]
}
