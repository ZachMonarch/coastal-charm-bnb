import { Badge } from '@/components/ui/badge';

type RFQStatus = 'draft' | 'open' | 'in_progress' | 'awarded' | 'completed' | 'cancelled';

interface RFQStatusBadgeProps {
  status: RFQStatus;
}

export function RFQStatusBadge({ status }: RFQStatusBadgeProps) {
  const statusConfig = {
    draft: { label: 'Draft', variant: 'secondary' as const },
    open: { label: 'Open for Bids', variant: 'default' as const },
    in_progress: { label: 'In Progress', variant: 'default' as const },
    awarded: { label: 'Awarded', variant: 'default' as const },
    completed: { label: 'Completed', variant: 'default' as const },
    cancelled: { label: 'Cancelled', variant: 'destructive' as const },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.label}
    </Badge>
  );
}
