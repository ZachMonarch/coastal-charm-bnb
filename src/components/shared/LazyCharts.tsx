/**
 * Lazy-loaded recharts wrapper to reduce initial bundle size
 * Recharts is ~200KB+ and only needed for dashboard views
 */
import React, { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Loading placeholder for charts
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Lazy load the DashboardChart component
const LazyDashboardChart = lazy(() => import('./DashboardChart'));

type ChartType = 'area' | 'bar' | 'line';
type ChartColor = 'primary' | 'success' | 'warning' | 'info' | 'destructive';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface LazyChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  type?: ChartType;
  color?: ChartColor;
  dataKey?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
  emptyMessage?: string;
}

/**
 * Lazy-loaded chart component that wraps DashboardChart
 * Use this instead of DashboardChart for non-critical chart views
 */
export function LazyChart(props: LazyChartProps) {
  return (
    <Suspense fallback={
      <Card className={cn('overflow-hidden', props.className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{props.title}</CardTitle>
          {props.description && <CardDescription>{props.description}</CardDescription>}
        </CardHeader>
        <CardContent className="pt-0">
          <ChartSkeleton height={props.height || 300} />
        </CardContent>
      </Card>
    }>
      <LazyDashboardChart {...props} />
    </Suspense>
  );
}

// Re-export types for convenience
export type { LazyChartProps, DataPoint, ChartType, ChartColor };

export default LazyChart;
