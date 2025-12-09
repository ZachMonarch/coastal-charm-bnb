import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ChartType = 'area' | 'bar' | 'line';
type ChartColor = 'primary' | 'success' | 'warning' | 'info' | 'destructive';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface DashboardChartProps {
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

const colorMap: Record<ChartColor, { fill: string; stroke: string }> = {
  primary: {
    fill: 'hsl(var(--primary) / 0.2)',
    stroke: 'hsl(var(--primary))',
  },
  success: {
    fill: 'hsl(var(--success) / 0.2)',
    stroke: 'hsl(var(--success))',
  },
  warning: {
    fill: 'hsl(var(--warning) / 0.2)',
    stroke: 'hsl(var(--warning))',
  },
  info: {
    fill: 'hsl(var(--info) / 0.2)',
    stroke: 'hsl(var(--info))',
  },
  destructive: {
    fill: 'hsl(var(--destructive) / 0.2)',
    stroke: 'hsl(var(--destructive))',
  },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-muted-foreground">
            {typeof entry.value === 'number' && entry.value >= 1000
              ? `$${entry.value.toLocaleString()}`
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardChart({
  title,
  description,
  data,
  type = 'area',
  color = 'primary',
  dataKey = 'value',
  height = 300,
  showGrid = true,
  className,
  emptyMessage = 'No data available',
}: DashboardChartProps) {
  const colors = colorMap[color];

  const renderChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: -10, bottom: 0 },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />}
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={dataKey}
              fill={colors.fill}
              stroke={colors.stroke}
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />}
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors.stroke}
              strokeWidth={2}
              dot={{ fill: colors.stroke, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'area':
      default:
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />}
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.stroke} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors.stroke}
              strokeWidth={2}
              fill={`url(#gradient-${color})`}
            />
          </AreaChart>
        );
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
