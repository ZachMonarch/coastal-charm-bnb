import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function VendorProjectListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Project Cards Skeleton */}
      <div className="grid gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress Bar Skeleton */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>

              {/* Details Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>

              {/* Tags Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}