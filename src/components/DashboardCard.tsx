import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import AnimatedCounter from "@/components/AnimatedCounter";

const dashboardCardVariants = cva(
  "rounded-lg border transition-all duration-normal",
  {
    variants: {
      variant: {
        default:
          "bg-card text-card-foreground border-border shadow-sm hover:shadow-md",
        elevated:
          "bg-card text-card-foreground border-border shadow-lg hover:shadow-xl",
        neumorphic:
          "neumorphic-card text-card-foreground",
        glass:
          "glass-card text-card-foreground backdrop-blur-md",
        gradient:
          "bg-gradient-to-br from-card to-muted text-card-foreground border-border shadow-md hover:shadow-lg",
        accent:
          "bg-card text-card-foreground border-l-4 border-l-primary border-border shadow-sm hover:shadow-md",
        interactive:
          "bg-card text-card-foreground border-border shadow-sm hover:shadow-lg hover:border-primary/50 cursor-pointer",
      },
      status: {
        none: "",
        success: "border-l-4 border-l-[hsl(var(--success))]",
        warning: "border-l-4 border-l-[hsl(var(--warning))]",
        error: "border-l-4 border-l-[hsl(var(--error))]",
        info: "border-l-4 border-l-[hsl(var(--info))]",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      status: "none",
      size: "md",
    },
  }
);

export interface DashboardCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dashboardCardVariants> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  value?: string | number;
  label?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  /** Enable animated count-up for numeric values */
  animateValue?: boolean;
  /** Animation duration in ms (default: 2000) */
  animationDuration?: number;
  /** Prefix for animated value (e.g., "$") */
  valuePrefix?: string;
  /** Suffix for animated value (e.g., "%") */
  valueSuffix?: string;
}

const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  (
    {
      className,
      variant,
      status,
      size,
      header,
      footer,
      icon,
      value,
      label,
      trend,
      animateValue = false,
      animationDuration = 2000,
      valuePrefix = "",
      valueSuffix = "",
      children,
      ...props
    },
    ref
  ) => {
    // Render the value - either animated or static
    const renderValue = () => {
      if (animateValue && typeof value === "number") {
        return (
          <AnimatedCounter
            value={value}
            duration={animationDuration}
            prefix={valuePrefix}
            suffix={valueSuffix}
            className="text-2xl font-bold tracking-tight"
          />
        );
      }
      return <p className="text-2xl font-bold tracking-tight">{valuePrefix}{value}{valueSuffix}</p>;
    };

    // KPI Card mode when value and label are provided
    if (value !== undefined && label) {
      return (
        <div
          ref={ref}
          className={cn(dashboardCardVariants({ variant, status, size }), className)}
          {...props}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              {renderValue()}
              {trend && (
                <p
                  className={cn(
                    "text-xs font-medium flex items-center gap-1",
                    trend.isPositive
                      ? "text-[hsl(var(--success))]"
                      : "text-[hsl(var(--error))]"
                  )}
                >
                  <span>{trend.isPositive ? "↑" : "↓"}</span>
                  <span>{Math.abs(trend.value)}%</span>
                </p>
              )}
            </div>
            {icon && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
          </div>
          {children}
        </div>
      );
    }

    // Standard card mode
    return (
      <div
        ref={ref}
        className={cn(dashboardCardVariants({ variant, status, size }), className)}
        {...props}
      >
        {header && (
          <div className="pb-3 mb-3 border-b border-border">
            {typeof header === "string" ? (
              <h3 className="font-semibold text-lg">{header}</h3>
            ) : (
              header
            )}
          </div>
        )}
        {children}
        {footer && (
          <div className="pt-3 mt-3 border-t border-border">{footer}</div>
        )}
      </div>
    );
  }
);

DashboardCard.displayName = "DashboardCard";

export { DashboardCard, dashboardCardVariants };
