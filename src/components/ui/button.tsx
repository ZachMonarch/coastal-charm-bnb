
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md dark:bg-destructive dark:text-destructive-foreground",
        outline:
          "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 dark:border-border dark:bg-background dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm dark:bg-secondary dark:text-secondary-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline active:scale-100 dark:text-primary",
        hero: "bg-overlay/20 text-white backdrop-blur-sm border border-white/30 hover:bg-overlay/30 shadow-lg hover:shadow-xl",
        heroSolid: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99]",
        neumorphic: "neumorphic-card hover:neumorphic-inset text-foreground dark:text-foreground",
        glass: "glass-card text-foreground hover:bg-white/20 dark:text-foreground dark:hover:bg-black/30",
        shimmer: "bg-gradient-to-r from-primary via-primary-light to-primary bg-[length:200%_100%] text-primary-foreground hover:bg-[position:100%_0] transition-all duration-500 shadow-md hover:shadow-primary/40",
        gradient: "bg-gradient-to-r from-primary to-primary-dark text-primary-foreground hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.99]",
        glow: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-300",
        heroAction: "bg-black/70 text-white border border-white/40 hover:bg-black/80 hover:text-white shadow-lg backdrop-blur-sm font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
