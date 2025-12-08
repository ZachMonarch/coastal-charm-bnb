import { useState, useMemo } from "react";
import { VendorBidWithProject } from "./useVendorRFQs";

interface FilterState {
  searchTerm: string;
  statusFilter: string;
  dateRange: { start: string; end: string };
  amountRange: { min: number; max: number };
}

export function useVendorApplicationsTable(applications: VendorBidWithProject[]) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    statusFilter: 'all',
    dateRange: { start: '', end: '' },
    amountRange: { min: 0, max: 0 }
  });

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          app.project?.title?.toLowerCase().includes(searchLower) ||
          app.project?.description?.toLowerCase().includes(searchLower) ||
          app.proposal_details?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.statusFilter && filters.statusFilter !== 'all') {
        if (app.status !== filters.statusFilter) return false;
      }

      // Date range filter
      if (filters.dateRange.start && app.submitted_at) {
        const submittedDate = new Date(app.submitted_at);
        const startDate = new Date(filters.dateRange.start);
        if (submittedDate < startDate) return false;
      }

      if (filters.dateRange.end && app.submitted_at) {
        const submittedDate = new Date(app.submitted_at);
        const endDate = new Date(filters.dateRange.end);
        if (submittedDate > endDate) return false;
      }

      // Amount range filter
      if (filters.amountRange.min > 0 && app.bid_amount) {
        if (app.bid_amount < filters.amountRange.min) return false;
      }

      if (filters.amountRange.max > 0 && app.bid_amount) {
        if (app.bid_amount > filters.amountRange.max) return false;
      }

      return true;
    });
  }, [applications, filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.amountRange.min > 0 || filters.amountRange.max > 0) count++;
    return count;
  }, [filters]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      dateRange: { start: '', end: '' },
      amountRange: { min: 0, max: 0 }
    });
  };

  return {
    filters,
    filteredApplications,
    activeFiltersCount,
    updateFilters,
    clearFilters,
    setSearchTerm: (searchTerm: string) => updateFilters({ searchTerm }),
    setStatusFilter: (statusFilter: string) => updateFilters({ statusFilter }),
    setDateRange: (dateRange: { start: string; end: string }) => updateFilters({ dateRange }),
    setAmountRange: (amountRange: { min: number; max: number }) => updateFilters({ amountRange })
  };
}