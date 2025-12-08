import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-normal focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Semantic variants with dark mode optimization
        success:
          "border-transparent bg-[hsl(var(--badge-success-bg))] text-[hsl(var(--badge-success-fg))] dark:bg-[hsl(var(--badge-success-bg))] dark:text-[hsl(var(--badge-success-fg))]",
        warning:
          "border-transparent bg-[hsl(var(--badge-warning-bg))] text-[hsl(var(--badge-warning-fg))] dark:bg-[hsl(var(--badge-warning-bg))] dark:text-[hsl(var(--badge-warning-fg))]",
        error:
          "border-transparent bg-[hsl(var(--badge-error-bg))] text-[hsl(var(--badge-error-fg))] dark:bg-[hsl(var(--badge-error-bg))] dark:text-[hsl(var(--badge-error-fg))]",
        info:
          "border-transparent bg-[hsl(var(--badge-info-bg))] text-[hsl(var(--badge-info-fg))] dark:bg-[hsl(var(--badge-info-bg))] dark:text-[hsl(var(--badge-info-fg))]",
        muted:
          "border-transparent bg-[hsl(var(--badge-muted-bg))] text-[hsl(var(--badge-muted-fg))] dark:bg-[hsl(var(--badge-muted-bg))] dark:text-[hsl(var(--badge-muted-fg))]",
        // Premium variants
        gold:
          "border-transparent bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
        teal:
          "border-transparent bg-secondary/10 text-secondary dark:bg-secondary/20 dark:text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
