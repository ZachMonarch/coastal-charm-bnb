import { ReactNode } from "react";
import { Card as ShadcnCard, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Token-driven Card Component
 * 
 * Variants:
 * - default: Standard card with border
 * - elevated: Card with shadow for prominence
 * - neumorphic: Soft UI with inset shadows
 * - glass: Glassmorphic effect with backdrop blur
 * 
 * Features:
 * - Interactive hover effects (when interactive=true)
 * - Equal height support for grid layouts
 * - Proper semantic HTML
 * - Accessible structure
 * 
 * @see Design Tokens: src/design-system/tokens.json
 */

export interface CardProps {
  variant?: "default" | "elevated" | "neumorphic" | "glass";
  interactive?: boolean;
  equalHeight?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  variant = "default",
  interactive = false,
  equalHeight = false,
  header,
  footer,
  children,
  className,
  onClick,
}: CardProps) {
  const variantClasses = {
    default: "bg-card border-border shadow-sm hover:shadow-md",
    elevated: "bg-card border-border shadow-lg hover:shadow-xl",
    neumorphic: "neumorphic-card",
    glass: "glass-card border-border/30",
  };

  return (
    <ShadcnCard
      className={cn(
        "transition-all duration-300",
        variantClasses[variant],
        interactive && "cursor-pointer hover:-translate-y-1 hover:shadow-lg",
        equalHeight && "h-full",
        className
      )}
      onClick={onClick}
    >
      {header && <CardHeader>{header}</CardHeader>}
      <CardContent className={cn(!header && "pt-6")}>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </ShadcnCard>
  );
}
