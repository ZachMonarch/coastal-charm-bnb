import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  startItem: number;
  endItem: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
}

export default function PropertyPagination({
  currentPage,
  totalPages,
  totalCount,
  startItem,
  endItem,
  hasNextPage,
  hasPreviousPage,
  onPageChange
}: PaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="neumorphic-card p-6 rounded-3xl">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        {/* Results Info */}
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startItem}</span> to{' '}
          <span className="font-medium text-foreground">{endItem}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> properties
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-2">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            aria-label="Go to previous page"
            className={cn(
              "neumorphic-card p-2 h-10 w-10",
              !hasPreviousPage && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {pageNumbers.map((page, index) => (
              page === 'ellipsis' ? (
                <div key={`ellipsis-${index}`} className="px-3 py-2">
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              ) : (
                <Button
                  key={page}
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "h-10 w-10 p-0 transition-all duration-300",
                    currentPage === page
                      ? "btn-primary"
                      : "neumorphic-card hover:neumorphic-inset"
                  )}
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            aria-label="Go to next page"
            className={cn(
              "neumorphic-card p-2 h-10 w-10",
              !hasNextPage && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Quick Page Navigation */}
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-muted-foreground">Go to:</span>
          <input
            type="number"
            aria-label="Go to page number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                onPageChange(page);
              }
            }}
            className="neumorphic-inset w-16 px-2 py-1 rounded-lg text-center border-0 bg-transparent focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-muted-foreground">of {totalPages}</span>
        </div>
      </div>
    </div>
  );
}