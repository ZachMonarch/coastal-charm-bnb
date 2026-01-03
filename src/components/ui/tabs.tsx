import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva(
  "inline-flex items-center text-muted-foreground",
  {
    variants: {
      variant: {
        default: "flex-wrap gap-1.5 rounded-lg bg-muted/60 p-1.5 border border-border/30",
        pills: "flex-wrap gap-2 bg-transparent p-1",
        underline: "flex-wrap gap-1 border-b border-border bg-transparent rounded-none pb-0",
        colorful: "flex-wrap gap-1.5 rounded-xl bg-primary/15 p-2 border border-primary/30 shadow-sm",
        grid: "grid gap-1 rounded-lg bg-muted/60 p-1.5 border border-border/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & 
    VariantProps<typeof tabsListVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap min-h-[36px] px-3 py-1.5 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-background/60 data-[state=active]:bg-background data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-sm",
        pills: "rounded-full border border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-muted/60 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary data-[state=active]:shadow-md",
        underline: "rounded-none border-b-2 border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold",
        colorful: "rounded-md text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-primary/15 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm",
        grid: "rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-background/60 data-[state=active]:bg-background data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & 
    VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-in",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
