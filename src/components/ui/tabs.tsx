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
          // HIGH CONTRAST: Maximum readability in both themes
          "text-foreground/80 dark:text-foreground/90",
          "[&>svg]:text-foreground/70 dark:[&>svg]:text-foreground/80 [&>svg]:opacity-100",
          "hover:text-foreground dark:hover:text-foreground hover:bg-muted/60",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          "data-[state=active]:[&>svg]:text-primary"
        ],
        pills: [
          "rounded-full border border-transparent",
          "text-foreground dark:text-foreground",
          "[&>span]:text-foreground [&>svg]:text-foreground/70 [&>svg]:opacity-100",
          "hover:bg-muted/50 hover:text-foreground",
          "data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
          "data-[state=active]:[&>svg]:text-primary"
        ],
        underline: [
          "rounded-none border-b-2 border-transparent pb-3",
          "text-foreground/70 dark:text-foreground/80",
          "[&>svg]:text-foreground/60 [&>svg]:opacity-100",
          "hover:text-foreground",
          "data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:font-semibold",
          "data-[state=active]:[&>svg]:text-primary"
        ],
        colorful: [
          "rounded-md gap-2",
          "text-foreground dark:text-foreground",
          "[&>span]:text-foreground",
          "[&>svg]:text-foreground/80 dark:[&>svg]:text-foreground/90 [&>svg]:[stroke-width:2.5] [&>svg]:opacity-100",
          "hover:bg-primary/10 hover:text-foreground",
          "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
          "data-[state=active]:[&>span]:text-primary-foreground data-[state=active]:[&>svg]:text-primary-foreground",
          "data-[state=active]:shadow-md data-[state=active]:font-semibold"
        ],
        grid: [
          "rounded-md flex-1",
          "text-foreground dark:text-foreground",
          "[&>span]:text-foreground [&>svg]:text-foreground/70 [&>svg]:opacity-100",
          "hover:bg-muted hover:text-foreground",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          "data-[state=active]:[&>svg]:text-primary"
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
