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
        // Semantic variants with ENHANCED dark mode visibility
        success:
          "border-success/30 bg-success/15 text-success dark:bg-success/25 dark:text-success dark:border-success/40",
        warning:
          "border-warning/30 bg-warning/15 text-warning dark:bg-warning/25 dark:text-warning dark:border-warning/40",
        error:
          "border-destructive/30 bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-destructive dark:border-destructive/40",
        info:
          "border-info/30 bg-info/15 text-info dark:bg-info/25 dark:text-info dark:border-info/40",
        muted:
          "border-muted-foreground/20 bg-muted text-muted-foreground dark:bg-muted/50 dark:text-muted-foreground",
        // Premium variants
        gold:
          "border-primary/30 bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary dark:border-primary/40",
        teal:
          "border-secondary/30 bg-secondary/15 text-secondary dark:bg-secondary/25 dark:text-secondary dark:border-secondary/40",
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
