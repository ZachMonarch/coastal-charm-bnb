import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

export type KPIColor = "primary" | "success" | "warning" | "info" | "teal";

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  className?: string;
  variant?: "default" | "interactive" | "gradient";
  color?: KPIColor;
}

const variantStyles: Record<NonNullable<KPICardProps["variant"]>, string> = {
  default:
    "shadow-md border border-border hover:shadow-lg bg-card",
  interactive:
    "shadow-lg border border-border/50 hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 bg-gradient-to-br from-card via-card to-primary/5",
  gradient:
    "shadow-xl border-0 bg-gradient-to-br from-primary/15 via-card to-accent/10 hover:shadow-2xl hover:-translate-y-1",
};

const colorStyles: Record<KPIColor, { iconBg: string; iconOverlay: string; valueHover: string; glowColor: string }> = {
  primary: {
    iconBg: "bg-gradient-to-br from-primary/30 to-primary/10 text-primary",
    iconOverlay: "from-primary via-primary-light to-primary-dark",
    valueHover: "group-hover:text-primary",
    glowColor: "shadow-primary/30",
  },
  success: {
    iconBg: "bg-gradient-to-br from-success/30 to-success/10 text-success",
    iconOverlay: "from-success via-success to-success",
    valueHover: "group-hover:text-success",
    glowColor: "shadow-success/30",
  },
  warning: {
    iconBg: "bg-gradient-to-br from-warning/30 to-warning/10 text-warning",
    iconOverlay: "from-warning via-warning to-warning",
    valueHover: "group-hover:text-warning",
    glowColor: "shadow-warning/30",
  },
  info: {
    iconBg: "bg-gradient-to-br from-info/30 to-info/10 text-info",
    iconOverlay: "from-info via-info to-info",
    valueHover: "group-hover:text-info",
    glowColor: "shadow-info/30",
  },
  teal: {
    iconBg: "bg-gradient-to-br from-secondary/30 to-secondary/10 text-secondary",
    iconOverlay: "from-secondary via-secondary to-secondary",
    valueHover: "group-hover:text-secondary",
    glowColor: "shadow-secondary/30",
  },
};

export default function KPICard({
  label,
  value,
  icon,
  trend,
  className,
  variant = "interactive",
  color = "primary",
}: KPICardProps) {
  const palette = colorStyles[color];

  return (
    <Card
      className={cn(
        "transition-all duration-300 overflow-hidden group bg-card",
        variantStyles[variant],
        className,
      )}
    >
      <CardContent className="p-6 relative">
        {/* Colorful gradient glow effect on hover */}
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-br from-transparent via-transparent to-transparent",
          color === "primary" && "group-hover:bg-gradient-to-br group-hover:from-primary/10 group-hover:via-transparent group-hover:to-primary/5",
          color === "success" && "group-hover:bg-gradient-to-br group-hover:from-success/10 group-hover:via-transparent group-hover:to-success/5",
          color === "warning" && "group-hover:bg-gradient-to-br group-hover:from-warning/10 group-hover:via-transparent group-hover:to-warning/5",
          color === "info" && "group-hover:bg-gradient-to-br group-hover:from-info/10 group-hover:via-transparent group-hover:to-info/5",
          color === "teal" && "group-hover:bg-gradient-to-br group-hover:from-secondary/10 group-hover:via-transparent group-hover:to-secondary/5",
        )} />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-wide">
            {label}
          </span>
          {icon && (
            <div className="relative">
              {/* Animated gradient ring around icon */}
              <div
                className={cn(
                  "absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-40 transition-all duration-300 blur-sm bg-gradient-to-br",
                  palette.iconOverlay,
                )}
              />
              <div
                className={cn(
                  "relative p-3 rounded-xl group-hover:scale-110 transition-all duration-300 shadow-md",
                  palette.iconBg,
                  `group-hover:shadow-lg group-hover:${palette.glowColor}`,
                )}
              >
                {icon}
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "text-3xl font-bold mb-2 relative z-10 transition-colors duration-300",
            "text-foreground",
            palette.valueHover,
          )}
        >
          {value}
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-300",
              trend.direction === "up" ? "text-success" : "text-destructive",
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-300",
                trend.direction === "up"
                  ? "bg-success/10 group-hover:bg-success/20"
                  : "bg-destructive/10 group-hover:bg-destructive/20",
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUp className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 animate-pulse" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
