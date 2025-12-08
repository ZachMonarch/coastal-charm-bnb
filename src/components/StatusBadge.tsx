import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "draft"
  | "pending"
  | "submitted"
  | "open"
  | "in_progress"
  | "in-progress"
  | "completed"
  | "approved"
  | "rejected"
  | "cancelled"
  | "overdue"
  | "active"
  | "inactive"
  | "verified"
  | "unverified"
  | "paid"
  | "unpaid"
  | "partial"
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "critical"
  | "awaiting_response"
  | "info_requested"
  | "docs_requested"
  | "under_review"
  | "under_negotiation"
  | "shortlisted"
  | "awarded"
  | "declined"
  | "accepted"
  | "expired"
  | "on_hold"
  | "assigned"
  | string;

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<
  string,
  { variant: "success" | "warning" | "error" | "info" | "muted" | "default" | "secondary"; label: string; icon?: string }
> = {
  // General statuses
  draft: { variant: "muted", label: "Draft", icon: "📝" },
  pending: { variant: "warning", label: "Pending", icon: "⏳" },
  submitted: { variant: "info", label: "Submitted", icon: "📤" },
  open: { variant: "info", label: "Open", icon: "📂" },
  in_progress: { variant: "info", label: "In Progress", icon: "🔄" },
  "in-progress": { variant: "info", label: "In Progress", icon: "🔄" },
  completed: { variant: "success", label: "Completed", icon: "✓" },
  approved: { variant: "success", label: "Approved", icon: "✓" },
  rejected: { variant: "error", label: "Rejected", icon: "✗" },
  cancelled: { variant: "muted", label: "Cancelled", icon: "⊘" },
  overdue: { variant: "error", label: "Overdue", icon: "⚠" },
  active: { variant: "success", label: "Active", icon: "●" },
  inactive: { variant: "muted", label: "Inactive", icon: "○" },
  on_hold: { variant: "warning", label: "On Hold", icon: "⏸" },
  assigned: { variant: "info", label: "Assigned", icon: "👤" },
  
  // Verification statuses
  verified: { variant: "success", label: "Verified", icon: "✓" },
  unverified: { variant: "warning", label: "Unverified", icon: "?" },
  
  // Payment statuses
  paid: { variant: "success", label: "Paid", icon: "💰" },
  unpaid: { variant: "error", label: "Unpaid", icon: "💳" },
  partial: { variant: "warning", label: "Partial", icon: "½" },
  
  // Priority levels
  low: { variant: "muted", label: "Low", icon: "▽" },
  medium: { variant: "warning", label: "Medium", icon: "◆" },
  high: { variant: "error", label: "High", icon: "▲" },
  urgent: { variant: "error", label: "Urgent", icon: "⚡" },
  critical: { variant: "error", label: "Critical", icon: "🔴" },
  
  // Bid/RFQ statuses
  awaiting_response: { variant: "warning", label: "Awaiting Response", icon: "⏳" },
  info_requested: { variant: "warning", label: "Info Requested", icon: "❓" },
  docs_requested: { variant: "warning", label: "Docs Requested", icon: "📄" },
  under_review: { variant: "info", label: "Under Review", icon: "🔍" },
  under_negotiation: { variant: "info", label: "Under Negotiation", icon: "🤝" },
  shortlisted: { variant: "info", label: "Shortlisted", icon: "⭐" },
  awarded: { variant: "success", label: "Awarded", icon: "🏆" },
  declined: { variant: "muted", label: "Declined", icon: "✗" },
  accepted: { variant: "success", label: "Accepted", icon: "✓" },
  expired: { variant: "muted", label: "Expired", icon: "⏰" },
};

const sizeClasses = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2.5 py-0.5",
  lg: "text-sm px-3 py-1",
};

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, showIcon = false, size = "md", className, ...props }, ref) => {
    const normalizedStatus = status.toLowerCase().replace(/[\s-]+/g, "_");
    const config = statusConfig[normalizedStatus] || {
      variant: "muted" as const,
      label: status.charAt(0).toUpperCase() + status.slice(1).replace(/[_-]/g, " "),
      icon: "•",
    };

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        className={cn(sizeClasses[size], className)}
        {...props}
      >
        {showIcon && config.icon && (
          <span className="mr-1">{config.icon}</span>
        )}
        {config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusConfig };
export type { StatusType };
