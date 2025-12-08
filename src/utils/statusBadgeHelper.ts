/**
 * Utility for theme-aware status badge colors
 * Uses semantic tokens for dark/light mode compatibility
 */

export const getStatusBadgeClass = (status: string): string => {
  const statusClasses: Record<string, string> = {
    // Payment statuses
    pending: 'bg-warning/10 text-warning border-warning/20',
    paid: 'bg-success/10 text-success border-success/20',
    overdue: 'bg-destructive/10 text-destructive border-destructive/20',
    cancelled: 'bg-muted text-muted-foreground border-border',
    
    // Project statuses
    open: 'bg-success/10 text-success border-success/20',
    in_progress: 'bg-info/10 text-info border-info/20',
    completed: 'bg-muted text-muted-foreground border-border',
    draft: 'bg-muted text-muted-foreground border-border',
    
    // Priority levels
    low: 'bg-muted text-muted-foreground border-border',
    medium: 'bg-warning/10 text-warning border-warning/20',
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    
    // Verification statuses
    verified: 'bg-success/10 text-success border-success/20',
    unverified: 'bg-warning/10 text-warning border-warning/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    
    // General statuses
    active: 'bg-success/10 text-success border-success/20',
    inactive: 'bg-muted text-muted-foreground border-border',
    sent: 'bg-info/10 text-info border-info/20',
    approved: 'bg-success/10 text-success border-success/20'
  };
  
  return statusClasses[status.toLowerCase()] || 'bg-muted text-muted-foreground border-border';
};

export const getPriorityBadgeClass = (priority: string): string => {
  return getStatusBadgeClass(priority);
};

export const getPaymentStatusBadgeClass = (status: string): string => {
  return getStatusBadgeClass(status);
};
