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
      "rounded-xl border border-border/60 bg-card/95 text-card-foreground shadow-sm transition-all duration-300 backdrop-blur-sm dark:bg-card/90 dark:border-border/80 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]",
      {
        'shadow-sm': variant === 'default',
        'shadow-lg hover:shadow-xl hover:-translate-y-1': variant === 'elevated',
        'shadow-md hover:shadow-primary/25 hover:-translate-y-0.5 hover:border-primary/40 bg-card/95 dark:bg-card/90': variant === 'interactive',
        'bg-gradient-to-br from-card via-card to-primary/10 shadow-md hover:shadow-primary/40 border-border/60': variant === 'gradient',
        'bg-card/80 dark:bg-card/70 backdrop-blur-xl border-border/40 shadow-md hover:shadow-primary/25': variant === 'glass',
        // Colorful variant with vibrant gradient background
        'bg-gradient-to-br from-primary/15 via-card to-secondary/10 border-primary/30 shadow-md hover:shadow-lg hover:border-primary/50': variant === 'colorful',
        // Accent left border variant
        'border-l-4 border-l-primary border-t-border/60 border-r-border/60 border-b-border/60 bg-gradient-to-r from-primary/5 to-card': variant === 'accent-left',
        // Status variants with vibrant colors
        'bg-gradient-to-br from-success/15 via-card to-success/5 border-success/40 shadow-md hover:shadow-success/20': variant === 'success',
        'bg-gradient-to-br from-warning/15 via-card to-warning/5 border-warning/40 shadow-md hover:shadow-warning/20': variant === 'warning',
        'bg-gradient-to-br from-info/15 via-card to-info/5 border-info/40 shadow-md hover:shadow-info/20': variant === 'info',
        // Premium variant with rainbow shimmer effect
        'bg-gradient-to-br from-primary/20 via-card to-accent/15 border-primary/40 shadow-lg hover:shadow-primary/30 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent before:animate-shimmer': variant === 'premium',
        // Hero variant for large feature cards
        'bg-gradient-to-br from-primary/25 via-primary/10 to-background border-primary/30 shadow-xl p-0 overflow-hidden': variant === 'hero',
        // Stats card variant optimized for KPI display
        'bg-gradient-to-br from-primary/20 via-card to-secondary/5 border-primary/25 shadow-md hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5': variant === 'stat-card',
        // Table container variant
        'bg-card/50 backdrop-blur-sm border-border/50 shadow-sm hover:shadow-md overflow-hidden': variant === 'table-container',
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
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
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
