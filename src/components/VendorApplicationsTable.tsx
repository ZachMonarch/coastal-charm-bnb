import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Calendar, DollarSign, Clock } from "lucide-react";
import { VendorBidWithProject } from "@/hooks/useVendorRFQs";

interface VendorApplicationsTableProps {
  applications: VendorBidWithProject[];
  loading: boolean;
  onEdit?: (application: VendorBidWithProject) => void;
  onView: (application: VendorBidWithProject) => void;
}

export default function VendorApplicationsTable({ 
  applications, 
  loading,
  onEdit, 
  onView 
}: VendorApplicationsTableProps) {
  const [sortField, setSortField] = useState<'submitted_at' | 'bid_amount' | 'status'>('submitted_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'submitted_at' | 'bid_amount' | 'status') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedApplications = [...applications].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'submitted_at':
        aValue = new Date(a.submitted_at || '').getTime();
        bValue = new Date(b.submitted_at || '').getTime();
        break;
      case 'bid_amount':
        aValue = a.bid_amount || 0;
        bValue = b.bid_amount || 0;
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'awarded':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'submitted':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFQ Name</TableHead>
              <TableHead>Submitted Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bid Amount</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-6 bg-muted animate-pulse rounded w-20" /></TableCell>
                <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-8 bg-muted animate-pulse rounded w-24" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">No Applications Found</h3>
            <p className="text-muted-foreground">You haven't submitted any bid applications yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('submitted_at')}
            >
              RFQ Name
              {sortField === 'submitted_at' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('submitted_at')}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Submitted Date
                {sortField === 'submitted_at' && (
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('status')}
            >
              Status
              {sortField === 'status' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('bid_amount')}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Bid Amount
                {sortField === 'bid_amount' && (
                  <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Duration
              </div>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedApplications.map((application) => (
            <TableRow key={application.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {application.project?.title || `Bid #${application.id.slice(0, 8)}`}
              </TableCell>
              <TableCell>
                {application.submitted_at 
                  ? new Date(application.submitted_at).toLocaleDateString()
                  : 'Draft'
                }
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(application.status || 'pending')}>
                  {application.status || 'pending'}
                </Badge>
              </TableCell>
              <TableCell>
                ${application.bid_amount?.toLocaleString() || 'Not specified'}
              </TableCell>
              <TableCell>
                {application.estimated_duration || 'Not specified'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(application)}
                    aria-label="View application details"
                    className="min-w-[44px] min-h-[44px]"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {(application.status === 'draft' || application.status === 'submitted') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(application)}
                      aria-label="Edit application"
                      className="min-w-[44px] min-h-[44px]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}