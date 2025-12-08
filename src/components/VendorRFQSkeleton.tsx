import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function VendorRFQSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab skeleton */}
      <div className="flex space-x-1 border-b">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      {/* Filter skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}