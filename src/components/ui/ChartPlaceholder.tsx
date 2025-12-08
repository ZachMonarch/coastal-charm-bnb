import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp } from "lucide-react";

interface ChartPlaceholderProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  height?: string;
}

export default function ChartPlaceholder({
  title = "Chart Area",
  description,
  icon,
  className,
  height = "h-[250px]",
}: ChartPlaceholderProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted/40 border border-border",
        "flex flex-col items-center justify-center",
        "text-muted-foreground",
        height,
        className
      )}
    >
      <div className="text-primary/60 mb-3">
        {icon || <BarChart3 className="w-12 h-12" strokeWidth={1.5} />}
      </div>
      <div className="text-center">
        <p className="font-medium text-sm">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
