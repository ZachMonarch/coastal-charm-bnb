import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function VendorProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-96" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-18" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-18" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones & Progress */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-8 w-8 rounded-full mt-1" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-6 w-6 rounded-full mt-1" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}