import React, { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load react-day-picker to reduce initial bundle size
const Calendar = lazy(() => 
  import('@/components/ui/calendar').then(module => ({ default: module.Calendar }))
);

// Loading placeholder for calendar
function CalendarSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-24" />
        <div className="flex gap-1">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-8 w-9" />
        ))}
      </div>
      {[...Array(5)].map((_, row) => (
        <div key={row} className="grid grid-cols-7 gap-1">
          {[...Array(7)].map((_, col) => (
            <Skeleton key={`${row}-${col}`} className="h-9 w-9 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Re-export Calendar type from original
export type { CalendarProps } from '@/components/ui/calendar';

// Lazy calendar component with suspense
export function LazyCalendar(props: React.ComponentProps<typeof Calendar>) {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <Calendar {...props} />
    </Suspense>
  );
}

export default LazyCalendar;
