import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tableContainerVariants = cva(
  "relative w-full overflow-auto rounded-lg",
  {
    variants: {
      variant: {
        default: "",
        bordered: "border border-border",
        colorful: "border-2 border-primary/20 shadow-sm hover:shadow-md transition-shadow",
        elevated: "shadow-md hover:shadow-lg transition-shadow bg-card rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableContainerVariants> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, ...props }, ref) => (
    <div className={cn(tableContainerVariants({ variant }))}>
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

const tableHeaderVariants = cva("[&_tr]:border-b", {
  variants: {
    colorScheme: {
      default: "bg-muted/50",
      primary: "bg-primary/5 dark:bg-primary/10",
      secondary: "bg-secondary/5 dark:bg-secondary/10",
      success: "bg-success/5 dark:bg-success/10",
      info: "bg-info/5 dark:bg-info/10",
    },
  },
  defaultVariants: {
    colorScheme: "default",
  },
})

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement>,
    VariantProps<typeof tableHeaderVariants> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, colorScheme, ...props }, ref) => (
    <thead ref={ref} className={cn(tableHeaderVariants({ colorScheme, className }))} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const tableRowVariants = cva(
  "border-b transition-colors",
  {
    variants: {
      variant: {
        default: "hover:bg-muted/50 data-[state=selected]:bg-muted",
        striped: "odd:bg-muted/30 even:bg-transparent hover:bg-muted/50",
        colorful: "hover:bg-primary/5 dark:hover:bg-primary/10 border-primary/10",
        interactive: "hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer hover:shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, variant, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(tableRowVariants({ variant, className }))}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

const tableHeadVariants = cva(
  "h-12 px-4 text-left align-middle font-semibold [&:has([role=checkbox])]:pr-0",
  {
    variants: {
      colorScheme: {
        default: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary",
        success: "text-success",
        info: "text-info",
      },
    },
    defaultVariants: {
      colorScheme: "default",
    },
  }
)

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableHeadVariants> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, colorScheme, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(tableHeadVariants({ colorScheme, className }))}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
