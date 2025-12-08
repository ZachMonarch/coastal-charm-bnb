import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { VendorBidWithProject } from "@/hooks/useVendorRFQs";

interface ApplicationsExportButtonProps {
  applications: VendorBidWithProject[];
  disabled?: boolean;
}

export default function ApplicationsExportButton({ 
  applications, 
  disabled 
}: ApplicationsExportButtonProps) {
  
  const exportToCSV = () => {
    if (!applications.length) return;

    // Define CSV headers
    const headers = [
      'RFQ Name',
      'Submitted Date',
      'Status',
      'Bid Amount',
      'Estimated Duration',
      'Proposal Details',
      'Project Category',
      'Project Budget Min',
      'Project Budget Max',
      'Project Deadline'
    ];

    // Convert data to CSV format
    const csvData = applications.map(app => [
      app.project?.title || `Bid #${app.id.slice(0, 8)}`,
      app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Draft',
      app.status || 'pending',
      app.bid_amount || 'Not specified',
      app.estimated_duration || 'Not specified',
      app.proposal_details || '',
      app.project?.category || '',
      app.project?.budget_min || '',
      app.project?.budget_max || '',
      app.project?.deadline ? new Date(app.project.deadline).toLocaleDateString() : ''
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(field => 
          // Escape commas and quotes in CSV fields
          typeof field === 'string' && (field.includes(',') || field.includes('"')) 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `vendor-applications-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      onClick={exportToCSV}
      disabled={disabled || applications.length === 0}
      className="flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </Button>
  );
}