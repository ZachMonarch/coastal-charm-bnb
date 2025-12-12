import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative h-4 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-secondary",
        success: "bg-success/20",
        warning: "bg-warning/20",
        error: "bg-destructive/20",
        info: "bg-info/20",
        gradient: "bg-muted",
      },
      size: {
        sm: "h-2",
        default: "h-4",
        lg: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-primary shadow-[0_0_8px_hsl(32_80%_40%/0.4)]",
        success: "bg-success shadow-[0_0_8px_hsl(155_60%_35%/0.4)]",
        warning: "bg-warning shadow-[0_0_8px_hsl(38_92%_50%/0.4)]",
        error: "bg-destructive shadow-[0_0_8px_hsl(0_75%_55%/0.4)]",
        info: "bg-info shadow-[0_0_8px_hsl(200_70%_50%/0.4)]",
        gradient: "bg-gradient-to-r from-primary via-secondary to-info",
      },
      animated: {
        true: "relative overflow-hidden",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  animated?: boolean
  showValue?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, animated, showValue, ...props }, ref) => (
  <div className="relative w-full">
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ variant, size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(indicatorVariants({ variant, animated }))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      >
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        )}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
    {showValue && (
      <span className="absolute right-0 -top-6 text-xs font-medium text-muted-foreground">
        {value}%
      </span>
    )}
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress, progressVariants }
