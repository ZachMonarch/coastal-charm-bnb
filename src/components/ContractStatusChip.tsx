import { Badge } from "@/components/ui/badge";

interface ContractStatusChipProps {
  status: string;
  className?: string;
}

export function ContractStatusChip({ status, className }: ContractStatusChipProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'in_progress':
      case 'assigned':
        return 'default'; // Green for active
      case 'on_hold':
        return 'secondary'; // Yellow for on hold
      case 'completed':
        return 'outline'; // Blue for completed
      case 'cancelled':
        return 'destructive'; // Red for cancelled
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
      case 'assigned':
        return 'Active';
      case 'on_hold':
        return 'On Hold';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'open':
        return 'Open';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {getStatusLabel(status)}
    </Badge>
  );
}