import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        filled: "border-transparent bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:bg-background",
        outline: "border-2 border-input focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        colorful: "border-2 border-primary/30 bg-primary/5 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:bg-background focus-visible:shadow-[0_0_15px_hsl(var(--primary)/0.15)]",
        success: "border-2 border-success/30 bg-success/5 focus-visible:outline-none focus-visible:border-success focus-visible:ring-4 focus-visible:ring-success/20 focus-visible:bg-background",
        warning: "border-2 border-warning/30 bg-warning/5 focus-visible:outline-none focus-visible:border-warning focus-visible:ring-4 focus-visible:ring-warning/20 focus-visible:bg-background",
        error: "border-2 border-destructive/30 bg-destructive/5 focus-visible:outline-none focus-visible:border-destructive focus-visible:ring-4 focus-visible:ring-destructive/20 focus-visible:bg-background",
      },
      inputSize: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, leftIcon, rightIcon, ...props }, ref) => {
    if (leftIcon || rightIcon) {
      return (
        <div className="relative w-full">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
