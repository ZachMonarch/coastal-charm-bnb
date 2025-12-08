import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ColorVariant = "primary" | "secondary" | "success" | "info";

interface ColorfulTableProps {
  children: React.ReactNode;
  color?: ColorVariant;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

interface ColorfulTableContainerProps {
  children: React.ReactNode;
  color?: ColorVariant;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const colorStyles: Record<ColorVariant, {
  headerBg: string;
  headerText: string;
  border: string;
  stripedBg: string;
  hoverBg: string;
}> = {
  primary: {
    headerBg: "bg-primary/5 dark:bg-primary/10",
    headerText: "text-primary dark:text-primary",
    border: "border-l-4 border-l-primary",
    stripedBg: "odd:bg-primary/[0.02] even:bg-transparent dark:odd:bg-primary/[0.05]",
    hoverBg: "hover:bg-primary/5 dark:hover:bg-primary/10",
  },
  secondary: {
    headerBg: "bg-secondary/5 dark:bg-secondary/10",
    headerText: "text-secondary dark:text-secondary",
    border: "border-l-4 border-l-secondary",
    stripedBg: "odd:bg-secondary/[0.02] even:bg-transparent dark:odd:bg-secondary/[0.05]",
    hoverBg: "hover:bg-secondary/5 dark:hover:bg-secondary/10",
  },
  success: {
    headerBg: "bg-success/5 dark:bg-success/10",
    headerText: "text-success dark:text-success",
    border: "border-l-4 border-l-success",
    stripedBg: "odd:bg-success/[0.02] even:bg-transparent dark:odd:bg-success/[0.05]",
    hoverBg: "hover:bg-success/5 dark:hover:bg-success/10",
  },
  info: {
    headerBg: "bg-info/5 dark:bg-info/10",
    headerText: "text-info dark:text-info",
    border: "border-l-4 border-l-info",
    stripedBg: "odd:bg-info/[0.02] even:bg-transparent dark:odd:bg-info/[0.05]",
    hoverBg: "hover:bg-info/5 dark:hover:bg-info/10",
  },
};

export function ColorfulTableContainer({
  children,
  color = "primary",
  title,
  description,
  actions,
  className,
}: ColorfulTableContainerProps) {
  const styles = colorStyles[color];

  return (
    <div className={cn(
      "rounded-xl overflow-hidden border border-border/50",
      styles.border,
      "bg-card shadow-sm hover:shadow-md transition-shadow duration-300",
      className
    )}>
      {(title || actions) && (
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b border-border/50",
          styles.headerBg
        )}>
          <div>
            {title && (
              <h3 className={cn("text-lg font-semibold", styles.headerText)}>
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

export function ColorfulTableHeader({
  children,
  color = "primary",
  className,
}: {
  children: React.ReactNode;
  color?: ColorVariant;
  className?: string;
}) {
  const styles = colorStyles[color];
  
  return (
    <TableHeader className={cn(styles.headerBg, className)}>
      {children}
    </TableHeader>
  );
}

export function ColorfulTableHead({
  children,
  color = "primary",
  className,
  ...props
}: React.ComponentProps<typeof TableHead> & { color?: ColorVariant }) {
  const styles = colorStyles[color];
  
  return (
    <TableHead 
      className={cn(
        "font-semibold",
        styles.headerText,
        className
      )} 
      {...props}
    >
      {children}
    </TableHead>
  );
}

export function ColorfulTableRow({
  children,
  color = "primary",
  striped = true,
  hoverable = true,
  className,
  ...props
}: React.ComponentProps<typeof TableRow> & {
  color?: ColorVariant;
  striped?: boolean;
  hoverable?: boolean;
}) {
  const styles = colorStyles[color];
  
  return (
    <TableRow 
      className={cn(
        "transition-colors duration-200",
        striped && styles.stripedBg,
        hoverable && styles.hoverBg,
        "border-b border-border/30",
        className
      )} 
      {...props}
    >
      {children}
    </TableRow>
  );
}

export { Table, TableBody, TableCell };
