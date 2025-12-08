import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";

interface ApplicationsTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  amountRange: { min: number; max: number };
  onAmountRangeChange: (range: { min: number; max: number }) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export default function ApplicationsTableFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  amountRange,
  onAmountRangeChange,
  onClearFilters,
  activeFiltersCount
}: ApplicationsTableFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'awarded', label: 'Awarded' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' }
  ];

  const quickFilters = [
    { key: 'recent', label: 'Recent', action: () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      onDateRangeChange({ start: sevenDaysAgo.toISOString().split('T')[0], end: '' });
    }},
    { key: 'pending', label: 'Pending Review', action: () => onStatusFilterChange('submitted') },
    { key: 'won', label: 'Won Bids', action: () => onStatusFilterChange('awarded') }
  ];

  return (
    <div className="space-y-4">
      {/* Main search and filter row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search RFQ names, descriptions..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <Button
            key={filter.key}
            variant="outline"
            size="sm"
            onClick={filter.action}
            className="text-sm"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Advanced filters */}
      {showAdvancedFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
          <h4 className="font-medium text-sm">Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date range filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Amount range filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Bid Amount Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={amountRange.min || ''}
                  onChange={(e) => onAmountRangeChange({ 
                    ...amountRange, 
                    min: parseFloat(e.target.value) || 0 
                  })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={amountRange.max || ''}
                  onChange={(e) => onAmountRangeChange({ 
                    ...amountRange, 
                    max: parseFloat(e.target.value) || 0 
                  })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}