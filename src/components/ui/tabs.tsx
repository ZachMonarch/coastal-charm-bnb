import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const tabsListVariants = cva(
  "inline-flex items-center justify-center rounded-lg p-1",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        pills: "bg-transparent gap-2",
        underline: "bg-transparent border-b border-border rounded-none p-0 gap-4",
        colorful: "bg-white dark:bg-[#1e1e1e] border border-primary/20 shadow-sm",
        grid: "bg-muted/50 gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: [
          "rounded-md",
          // Enhanced contrast: explicit hex colors for better readability
          "text-[#3a3a3a] dark:text-slate-300",
          "hover:text-[#1a1a1a] dark:hover:text-slate-100",
          "data-[state=active]:bg-background data-[state=active]:text-[#1a1a1a] dark:data-[state=active]:text-slate-50 data-[state=active]:shadow-sm"
        ],
        pills: [
          "rounded-full border border-transparent",
          "text-[#1a1a1a] dark:text-slate-100",
          "[&>span]:text-[#1a1a1a] [&>span]:dark:text-slate-100",
          "hover:bg-muted/50 hover:text-[#1a1a1a] dark:hover:text-slate-100",
          "data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
        ],
        underline: [
          "rounded-none border-b-2 border-transparent pb-3",
          "text-[#4a4a4a] dark:text-slate-400",
          "hover:text-[#1a1a1a] dark:hover:text-slate-100",
          "data-[state=active]:border-primary data-[state=active]:text-[#1a1a1a] dark:data-[state=active]:text-slate-50 data-[state=active]:font-semibold"
        ],
        colorful: [
          "rounded-md gap-2",
          "text-[#1a1a1a] dark:text-slate-100",
          "[&>span]:text-[#1a1a1a] [&>span]:dark:text-slate-100",
          "[&>svg]:text-[#1a1a1a] [&>svg]:dark:text-slate-300 [&>svg]:[stroke-width:2.5]",
          "hover:bg-primary/10 hover:text-black dark:hover:text-white",
          "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:[&>span]:text-white data-[state=active]:[&>svg]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold"
        ],
        grid: [
          "rounded-md flex-1",
          "text-[#1a1a1a] dark:text-slate-100",
          "[&>span]:text-[#1a1a1a] [&>span]:dark:text-slate-100",
          "hover:bg-muted hover:text-[#1a1a1a] dark:hover:text-slate-100",
          "data-[state=active]:bg-background data-[state=active]:text-[#1a1a1a] dark:data-[state=active]:text-slate-50 data-[state=active]:shadow-sm"
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
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
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-in",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
