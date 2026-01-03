import * as React from "react"

import { cn } from "@/lib/utils"

type CardVariant = 
  | 'default' 
  | 'elevated' 
  | 'interactive' 
  | 'gradient' 
  | 'glass' 
  | 'colorful' 
  | 'accent-left' 
  | 'success' 
  | 'warning' 
  | 'info'
  | 'premium'
  | 'hero'
  | 'stat-card'
  | 'table-container';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: CardVariant
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Base styles with standardized opacity (using design system scale)
      "rounded-xl border border-border/[0.6] bg-card/[0.95] text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-sm",
      // Dark mode enhancements
      "dark:bg-card/[0.9] dark:border-border/[0.8] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
      {
        // Default - subtle shadow
        'shadow-sm': variant === 'default',
        // Elevated - strong lift effect
        'shadow-lg hover:shadow-xl hover:-translate-y-1': variant === 'elevated',
        // Interactive - responds to hover with primary accent
        'shadow-md hover:shadow-primary/[0.25] hover:-translate-y-0.5 hover:border-primary/[0.4] bg-card/[0.95] dark:bg-card/[0.9]': variant === 'interactive',
        // Gradient - subtle primary gradient overlay
        'bg-gradient-to-br from-card via-card to-primary/[0.1] shadow-md hover:shadow-primary/[0.4] border-border/[0.6]': variant === 'gradient',
        // Glass - frosted glass effect
        'bg-card/[0.8] dark:bg-card/[0.7] backdrop-blur-xl border-border/[0.4] shadow-md hover:shadow-primary/[0.25]': variant === 'glass',
        // Colorful - vibrant gradient background (increased opacity for light mode visibility)
        'bg-gradient-to-br from-primary/[0.20] via-card to-secondary/[0.12] border-primary/[0.35] shadow-md hover:shadow-lg hover:border-primary/[0.5]': variant === 'colorful',
        // Accent left - gold accent border
        'border-l-4 border-l-primary border-t-border/[0.6] border-r-border/[0.6] border-b-border/[0.6] bg-gradient-to-r from-primary/[0.08] to-card': variant === 'accent-left',
        // Status variants - success/warning/info with increased opacity for light mode
        'bg-gradient-to-br from-success/[0.20] via-card to-success/[0.08] border-success/[0.45] shadow-md hover:shadow-success/[0.2]': variant === 'success',
        'bg-gradient-to-br from-warning/[0.20] via-card to-warning/[0.08] border-warning/[0.45] shadow-md hover:shadow-warning/[0.2]': variant === 'warning',
        'bg-gradient-to-br from-info/[0.20] via-card to-info/[0.08] border-info/[0.45] shadow-md hover:shadow-info/[0.2]': variant === 'info',
        // Premium - shimmer effect
        'bg-gradient-to-br from-primary/[0.2] via-card to-accent/[0.15] border-primary/[0.4] shadow-lg hover:shadow-primary/[0.3] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/[0.1] before:to-transparent before:animate-shimmer': variant === 'premium',
        // Hero - large feature cards
        'bg-gradient-to-br from-primary/[0.25] via-primary/[0.1] to-background border-primary/[0.3] shadow-xl p-0 overflow-hidden': variant === 'hero',
        // Stats card - KPI display
        'bg-gradient-to-br from-primary/[0.2] via-card to-secondary/[0.05] border-primary/[0.25] shadow-md hover:shadow-lg hover:border-primary/[0.4] hover:-translate-y-0.5': variant === 'stat-card',
        // Table container
        'bg-card/[0.5] backdrop-blur-sm border-border/[0.5] shadow-sm hover:shadow-md overflow-hidden': variant === 'table-container',
      },
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
