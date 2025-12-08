import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-transparent data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        colorful: "border-primary/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary data-[state=checked]:to-primary-light data-[state=checked]:border-primary data-[state=checked]:shadow-[0_0_12px_hsl(var(--primary)/0.4)] data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
        success: "border-success/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-success data-[state=checked]:to-success/80 data-[state=checked]:border-success data-[state=checked]:shadow-[0_0_12px_hsl(var(--success)/0.4)] data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
        warning: "border-warning/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-warning data-[state=checked]:to-warning/80 data-[state=checked]:border-warning data-[state=checked]:shadow-[0_0_12px_hsl(var(--warning)/0.4)] data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
        info: "border-info/30 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-info data-[state=checked]:to-info/80 data-[state=checked]:border-info data-[state=checked]:shadow-[0_0_12px_hsl(var(--info)/0.4)] data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
      },
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-all duration-300",
  {
    variants: {
      size: {
        default: "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        sm: "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
        lg: "h-6 w-6 data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, variant, size, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchVariants({ variant, size, className }))}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className={cn(thumbVariants({ size }))} />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch, switchVariants }
