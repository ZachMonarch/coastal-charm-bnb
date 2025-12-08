import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChartContainerProps {
  title: string;
  description?: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  height?: number;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  loading = false,
  children,
  className,
  action,
  height = 300,
}) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4" style={{ height }}>
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : (
          <div style={{ height }}>{children}</div>
        )}
      </CardContent>
    </Card>
  );
};

// Chart color utilities using CSS variables
export const getChartColors = () => ({
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  info: 'hsl(var(--info))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted-foreground))',
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',
});

// Custom tooltip component for Recharts
export const CustomTooltip = ({ 
  active, 
  payload, 
  label,
  formatter 
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}) => {
  if (!active || !payload) return null;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[120px]">
      {label && (
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      )}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
          </span>
          <span className="font-medium">
            {formatter ? formatter(entry.value, entry.name) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChartContainer;
