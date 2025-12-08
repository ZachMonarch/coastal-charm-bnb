/**
 * Theme-aware color utility system for Monarch Property Management
 * Provides consistent status, priority, and semantic colors across light/dark modes
 */

export const statusColors = {
  // RFQ/Project statuses
  draft: 'bg-muted text-muted-foreground border-border',
  open: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  submitted: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  under_review: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  in_progress: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  awarded: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  rejected: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  
  // General statuses
  active: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  inactive: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  approved: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  on_hold: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  assigned: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  
  // Verification statuses
  verified: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  unverified: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  
  // Health statuses
  healthy: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  degraded: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  down: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
} as const;

export const priorityColors = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  high: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  urgent: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  critical: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
} as const;

export const paymentStatusColors = {
  paid: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  pending: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  overdue: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  processing: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  failed: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  refunded: 'bg-muted text-muted-foreground border-border',
  requested: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  approved: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
} as const;

export const propertyStatusColors = {
  available: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  rented: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  maintenance: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  unavailable: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  pending: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
} as const;

export const iconColors = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
  info: 'text-info',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  orange: 'text-warning',
  purple: 'text-primary',
  green: 'text-success',
  red: 'text-destructive',
  blue: 'text-info',
  yellow: 'text-warning',
} as const;

/**
 * Get theme-aware status color classes
 */
export function getStatusColor(status: string): string {
  const normalized = status.toLowerCase().replace(/\s+/g, '_');
  return statusColors[normalized as keyof typeof statusColors] || statusColors.draft;
}

/**
 * Get theme-aware priority color classes
 */
export function getPriorityColor(priority: string): string {
  const normalized = priority.toLowerCase();
  return priorityColors[normalized as keyof typeof priorityColors] || priorityColors.low;
}

/**
 * Get theme-aware payment status color classes
 */
export function getPaymentStatusColor(status: string): string {
  const normalized = status.toLowerCase();
  return paymentStatusColors[normalized as keyof typeof paymentStatusColors] || paymentStatusColors.pending;
}

/**
 * Get theme-aware icon color classes
 */
export function getIconColor(type: keyof typeof iconColors): string {
  return iconColors[type];
}

/**
 * Chart colors using CSS variables for theme compatibility
 */
export const chartColors = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
} as const;

export const chartColorArray = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.tertiary,
  chartColors.quaternary,
  chartColors.quinary,
];

/**
 * Card border color variants for theme-aware borders
 */
export const cardBorderColors = {
  success: 'border-success/30 dark:border-success/40',
  warning: 'border-warning/30 dark:border-warning/40',
  error: 'border-destructive/30 dark:border-destructive/40',
  info: 'border-info/30 dark:border-info/40',
  primary: 'border-primary/30 dark:border-primary/40',
  muted: 'border-border',
} as const;

/**
 * Icon color map for consistent icon theming
 */
export const iconColorMap = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
  info: 'text-info',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
} as const;

/**
 * Category colors for amenities and features
 */
export const categoryColors = {
  connectivity: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  convenience: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
  safety: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  wellness: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  entertainment: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
  accessibility: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  outdoor: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  storage: 'bg-muted text-muted-foreground border-border',
  pets: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
  utilities: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  // Integration check categories
  core: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
  security: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  business: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  features: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  // Additional amenity categories
  recreation: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
  dining: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  technology: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  service: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
  community: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
} as const;

/**
 * Role badge colors for user roles
 */
export const roleBadgeColors = {
  admin: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  property_manager: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
  vendor: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  tenant: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  user: 'bg-muted text-muted-foreground border-border',
} as const;

/**
 * Risk level colors for admin controls
 */
export const riskLevelColors = {
  low: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  medium: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  high: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  critical: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
} as const;

/**
 * Action type colors for activity logs
 */
export const actionTypeColors = {
  create: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  update: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  delete: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  login: 'bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:border-primary/40',
  logout: 'bg-muted text-muted-foreground border-border',
  access: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  security: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
} as const;

/**
 * Diagnostic status colors for system health checks
 */
export const diagnosticStatusColors = {
  pass: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  warning: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  fail: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  running: 'bg-info/10 text-info border-info/30 dark:bg-info/20 dark:border-info/40',
  success: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  error: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
  operational: 'bg-success/10 text-success border-success/30 dark:bg-success/20 dark:border-success/40',
  degraded: 'bg-warning/10 text-warning border-warning/30 dark:bg-warning/20 dark:border-warning/40',
  down: 'bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:border-destructive/40',
} as const;

/**
 * Diagnostic icon colors
 */
export const diagnosticIconColors = {
  pass: 'text-success',
  warning: 'text-warning',
  fail: 'text-destructive',
  running: 'text-info',
  pending: 'text-muted-foreground',
  success: 'text-success',
  error: 'text-destructive',
} as const;

/**
 * Get theme-aware category color classes
 */
export function getCategoryColor(category: string): string {
  const normalized = category.toLowerCase();
  return categoryColors[normalized as keyof typeof categoryColors] || categoryColors.convenience;
}

/**
 * Get theme-aware role badge color classes
 */
export function getRoleBadgeColor(role: string): string {
  const normalized = role.toLowerCase();
  return roleBadgeColors[normalized as keyof typeof roleBadgeColors] || roleBadgeColors.user;
}

/**
 * Get theme-aware risk level color classes
 */
export function getRiskLevelColor(level: string): string {
  const normalized = level.toLowerCase();
  return riskLevelColors[normalized as keyof typeof riskLevelColors] || riskLevelColors.low;
}

/**
 * Get theme-aware action type color classes
 */
export function getActionTypeColor(action: string): string {
  const normalized = action.toLowerCase();
  return actionTypeColors[normalized as keyof typeof actionTypeColors] || actionTypeColors.update;
}

/**
 * Get theme-aware property status color classes
 */
export function getPropertyStatusColor(status: string): string {
  const normalized = status.toLowerCase();
  return propertyStatusColors[normalized as keyof typeof propertyStatusColors] || propertyStatusColors.available;
}

/**
 * Get theme-aware diagnostic icon color classes
 */
export function getDiagnosticIconColor(status: string): string {
  const normalized = status.toLowerCase();
  return diagnosticIconColors[normalized as keyof typeof diagnosticIconColors] || diagnosticIconColors.pending;
}

/**
 * Get theme-aware category icon color for system diagnostics
 */
export function getCategoryIconColor(category: string): string {
  const categoryMap: Record<string, keyof typeof iconColors> = {
    core: 'primary',
    security: 'error',
    business: 'success',
    features: 'info',
    connectivity: 'info',
    safety: 'error',
    wellness: 'success',
  };
  
  const iconColorKey = categoryMap[category.toLowerCase()] || 'muted';
  return iconColors[iconColorKey];
}
