import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
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
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  showCount?: boolean
  maxLength?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, showCount, maxLength, value, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = React.useState(0)

    React.useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      onChange?.(e)
    }

    if (showCount && maxLength) {
      return (
        <div className="relative w-full">
          <textarea
            className={cn(textareaVariants({ variant }), "pb-6", className)}
            ref={ref}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />
          <span className={cn(
            "absolute bottom-2 right-3 text-xs",
            charCount >= maxLength ? "text-destructive font-medium" : "text-muted-foreground"
          )}>
            {charCount}/{maxLength}
          </span>
        </div>
      )
    }

    return (
      <textarea
        className={cn(textareaVariants({ variant }), className)}
        ref={ref}
        value={value}
        onChange={onChange}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
