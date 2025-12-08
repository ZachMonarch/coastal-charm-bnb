import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type ColorVariant = "primary" | "secondary" | "success" | "warning" | "error" | "info" | "teal";

interface ColorfulCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  color?: ColorVariant;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bordered?: boolean;
  glowing?: boolean;
}

const colorStyles: Record<ColorVariant, {
  border: string;
  iconBg: string;
  iconColor: string;
  glow: string;
  headerGradient: string;
}> = {
  primary: {
    border: "border-l-4 border-l-primary",
    iconBg: "bg-primary/10 dark:bg-primary/20",
    iconColor: "text-primary",
    glow: "hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
    headerGradient: "bg-gradient-to-r from-primary/5 to-transparent",
  },
  secondary: {
    border: "border-l-4 border-l-secondary",
    iconBg: "bg-secondary/10 dark:bg-secondary/20",
    iconColor: "text-secondary",
    glow: "hover:shadow-[0_0_30px_hsl(var(--secondary)/0.2)]",
    headerGradient: "bg-gradient-to-r from-secondary/5 to-transparent",
  },
  success: {
    border: "border-l-4 border-l-success",
    iconBg: "bg-success/10 dark:bg-success/20",
    iconColor: "text-success",
    glow: "hover:shadow-[0_0_30px_hsl(var(--success)/0.2)]",
    headerGradient: "bg-gradient-to-r from-success/5 to-transparent",
  },
  warning: {
    border: "border-l-4 border-l-warning",
    iconBg: "bg-warning/10 dark:bg-warning/20",
    iconColor: "text-warning",
    glow: "hover:shadow-[0_0_30px_hsl(var(--warning)/0.2)]",
    headerGradient: "bg-gradient-to-r from-warning/5 to-transparent",
  },
  error: {
    border: "border-l-4 border-l-destructive",
    iconBg: "bg-destructive/10 dark:bg-destructive/20",
    iconColor: "text-destructive",
    glow: "hover:shadow-[0_0_30px_hsl(var(--destructive)/0.2)]",
    headerGradient: "bg-gradient-to-r from-destructive/5 to-transparent",
  },
  info: {
    border: "border-l-4 border-l-info",
    iconBg: "bg-info/10 dark:bg-info/20",
    iconColor: "text-info",
    glow: "hover:shadow-[0_0_30px_hsl(var(--info)/0.2)]",
    headerGradient: "bg-gradient-to-r from-info/5 to-transparent",
  },
  teal: {
    border: "border-l-4 border-l-secondary",
    iconBg: "bg-secondary/10 dark:bg-secondary/20",
    iconColor: "text-secondary",
    glow: "hover:shadow-[0_0_30px_hsl(var(--secondary)/0.2)]",
    headerGradient: "bg-gradient-to-r from-secondary/5 to-transparent",
  },
};

export default function ColorfulCard({
  title,
  description,
  icon: Icon,
  color = "primary",
  children,
  footer,
  className,
  headerClassName,
  bordered = true,
  glowing = true,
}: ColorfulCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        bordered && styles.border,
        glowing && styles.glow,
        "hover:translate-y-[-2px]",
        className
      )}
    >
      {/* Decorative corner gradient */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 opacity-50 pointer-events-none",
        `bg-gradient-to-bl from-${color === 'error' ? 'destructive' : color}/10 to-transparent`
      )} />
      
      {(title || description || Icon) && (
        <CardHeader className={cn(styles.headerGradient, headerClassName)}>
          <div className="flex items-start gap-4">
            {Icon && (
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-300 hover:scale-110",
                styles.iconBg
              )}>
                <Icon className={cn("w-6 h-6", styles.iconColor)} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <CardTitle className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="mt-1 text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(!title && !description && !Icon && "pt-6")}>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className="border-t border-border/50 bg-muted/30">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
