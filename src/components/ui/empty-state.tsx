import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { LucideIcon, Inbox, FileX, Search, FolderOpen, Users, Package } from "lucide-react"
import { Button } from "./button"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center p-8 rounded-xl border-2 border-dashed transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-muted-foreground/20 bg-muted/30",
        colorful: "border-primary/30 bg-gradient-to-br from-primary/5 via-background to-secondary/5",
        minimal: "border-transparent bg-transparent",
        success: "border-success/30 bg-success/5",
        warning: "border-warning/30 bg-warning/5",
        error: "border-destructive/30 bg-destructive/5",
      },
      size: {
        sm: "p-4 gap-2",
        default: "p-8 gap-4",
        lg: "p-12 gap-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const iconContainerVariants = cva(
  "flex items-center justify-center rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        colorful: "bg-gradient-to-br from-primary/20 to-secondary/20 text-primary shadow-lg shadow-primary/10",
        minimal: "bg-transparent text-muted-foreground",
        success: "bg-success/20 text-success",
        warning: "bg-warning/20 text-warning",
        error: "bg-destructive/20 text-destructive",
      },
      size: {
        sm: "w-10 h-10",
        default: "w-16 h-16",
        lg: "w-24 h-24",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const iconSizeMap = {
  sm: "w-5 h-5",
  default: "w-8 h-8",
  lg: "w-12 h-12",
}

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "ghost"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    className, 
    variant, 
    size = "default", 
    icon: Icon = Inbox, 
    title, 
    description, 
    action,
    secondaryAction,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ variant, size }), className)}
        {...props}
      >
        <div className={cn(iconContainerVariants({ variant, size }), "animate-pulse")}>
          <Icon className={iconSizeMap[size || "default"]} />
        </div>
        
        <div className="space-y-1">
          <h3 className={cn(
            "font-semibold text-foreground",
            size === "sm" && "text-sm",
            size === "default" && "text-lg",
            size === "lg" && "text-xl"
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              "text-muted-foreground max-w-sm mx-auto",
              size === "sm" && "text-xs",
              size === "default" && "text-sm",
              size === "lg" && "text-base"
            )}>
              {description}
            </p>
          )}
        </div>

        {(action || secondaryAction) && (
          <div className="flex items-center gap-3 mt-2">
            {action && (
              <Button 
                variant={action.variant || "default"} 
                size={size === "lg" ? "default" : "sm"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                variant="ghost" 
                size={size === "lg" ? "default" : "sm"}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

// Pre-configured empty states for common use cases
const NoDataState = (props: Partial<EmptyStateProps>) => (
  <EmptyState
    icon={Inbox}
    title="No data available"
    description="There's nothing to show here yet."
    variant="colorful"
    {...props}
  />
)

const NoSearchResultsState = (props: Partial<EmptyStateProps>) => (
  <EmptyState
    icon={Search}
    title="No results found"
    description="Try adjusting your search or filters to find what you're looking for."
    variant="default"
    {...props}
  />
)

const NoFilesState = (props: Partial<EmptyStateProps>) => (
  <EmptyState
    icon={FileX}
    title="No files uploaded"
    description="Upload files to get started."
    variant="colorful"
    {...props}
  />
)

const EmptyFolderState = (props: Partial<EmptyStateProps>) => (
  <EmptyState
    icon={FolderOpen}
    title="This folder is empty"
    description="Add items to this folder to see them here."
    variant="default"
    {...props}
  />
)

const NoUsersState = (props: Partial<EmptyStateProps>) => (
  <EmptyState
    icon={Users}
    title="No users found"
    description="Invite team members to get started."
    variant="colorful"
    {...props}
  />
)

const NoProductsState = (props: Partial<EmptyStateProps>) => (
  <EmptyState
    icon={Package}
    title="No products available"
    description="Add products to your catalog."
    variant="colorful"
    {...props}
  />
)

export { 
  EmptyState, 
  emptyStateVariants,
  NoDataState,
  NoSearchResultsState,
  NoFilesState,
  EmptyFolderState,
  NoUsersState,
  NoProductsState
}
