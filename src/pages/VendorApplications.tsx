import { useState } from "react";
import { useVendorRFQs } from "@/hooks/useVendorRFQs";
import { useVendorApplicationsTable } from "@/hooks/useVendorApplicationsTable";
import VendorApplicationsTable from "@/components/VendorApplicationsTable";
import ApplicationsTableFilters from "@/components/ApplicationsTableFilters";
import ApplicationsExportButton from "@/components/ApplicationsExportButton";
import PrivatePageWrapper from "@/components/PrivatePageWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, XCircle, MessageSquare, AlertCircle } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import StatsCard from "@/components/shared/StatsCard";
import { formatDistanceToNow } from "date-fns";

export default function VendorApplications() {
  const { myBids: vendorApplications, loading: isLoading } = useVendorRFQs();
  
  const {
    filteredApplications,
    filters,
    activeFiltersCount,
    setSearchTerm,
    setStatusFilter,
    setDateRange,
    setAmountRange,
    clearFilters
  } = useVendorApplicationsTable(vendorApplications);

  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleView = (application: any) => {
    setSelectedApplication(application);
    setIsViewDialogOpen(true);
  };

  // Stats calculations
  const pendingCount = vendorApplications.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
  const acceptedCount = vendorApplications.filter(a => a.status === 'awarded' || a.status === 'completed').length;
  const rejectedCount = vendorApplications.filter(a => a.status === 'rejected').length;
  const withFeedback = vendorApplications.filter(a => a.admin_feedback).length;

  return (
    <PrivatePageWrapper title="My Applications">
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Hero Section */}
          <PageHero
            title="My Applications"
            description="Track your project applications and their status in real-time"
            icon={FileText}
            variant="gradient"
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
              title="Total Applications"
              value={vendorApplications.length}
              icon={FileText}
              color="info"
            />
            <StatsCard
              title="Pending"
              value={pendingCount}
              icon={Clock}
              color="warning"
            />
            <StatsCard
              title="Accepted"
              value={acceptedCount}
              icon={CheckCircle}
              color="success"
            />
            <StatsCard
              title="Rejected"
              value={rejectedCount}
              icon={XCircle}
              color="error"
            />
            <StatsCard
              title="With Feedback"
              value={withFeedback}
              icon={MessageSquare}
              color="info"
            />
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <ApplicationsExportButton 
              applications={filteredApplications}
              disabled={isLoading}
            />
          </div>

          {/* Filters */}
          <Card variant="glass">
            <CardContent className="p-4">
              <ApplicationsTableFilters
                searchTerm={filters.searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={filters.statusFilter}
                onStatusFilterChange={setStatusFilter}
                dateRange={filters.dateRange}
                onDateRangeChange={setDateRange}
                amountRange={filters.amountRange}
                onAmountRangeChange={setAmountRange}
                onClearFilters={clearFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </CardContent>
          </Card>

          {/* Applications Table */}
          <VendorApplicationsTable
            applications={filteredApplications}
            loading={isLoading}
            onView={handleView}
          />

          {/* Application Details Dialog with Feedback */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-2xl bg-gradient-to-br from-card to-card/95">
              <DialogHeader>
                <DialogTitle>Application Details</DialogTitle>
              </DialogHeader>
              {selectedApplication && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <label className="text-sm font-medium text-muted-foreground">Project</label>
                      <p className="font-medium mt-1">{selectedApplication.projects?.title || selectedApplication.project?.title || 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <label className="text-sm font-medium text-muted-foreground">Bid Amount</label>
                      <p className="font-medium mt-1 text-primary">${selectedApplication.bid_amount?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <label className="text-sm font-medium text-muted-foreground">Proposal</label>
                    <p className="whitespace-pre-wrap mt-1">{selectedApplication.proposal_details}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <label className="text-sm font-medium text-muted-foreground">Estimated Duration</label>
                      <p className="font-medium mt-1">{selectedApplication.estimated_duration || 'Not specified'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/30">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge variant={
                          selectedApplication.status === 'awarded' ? 'default' :
                          selectedApplication.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {selectedApplication.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                    <p className="font-medium mt-1">{new Date(selectedApplication.submitted_at).toLocaleDateString()}</p>
                  </div>
                  
                  {/* Admin Feedback Section */}
                  {selectedApplication.admin_feedback && (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-warning" />
                        <label className="text-sm font-medium text-warning">Admin Feedback</label>
                      </div>
                      <p className="whitespace-pre-wrap text-foreground">{selectedApplication.admin_feedback}</p>
                      {selectedApplication.feedback_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Received {formatDistanceToNow(new Date(selectedApplication.feedback_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* No Feedback Yet for Rejected */}
                  {selectedApplication.status === 'rejected' && !selectedApplication.admin_feedback && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-muted">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No feedback provided for this application.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </PrivatePageWrapper>
  );
}
