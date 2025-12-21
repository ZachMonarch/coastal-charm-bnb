import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
  minimal?: boolean;
}

// Memoized for performance - prevents re-renders during Suspense
const LoadingSpinner = memo(function LoadingSpinner({ 
  className, 
  size = "md", 
  text,
  minimal = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  // Minimal mode for faster initial render during route transitions
  if (minimal) {
    return (
      <div className={cn("flex items-center justify-center min-h-[200px]", className)}>
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <div className="neumorphic-card p-6 rounded-3xl">
        <Loader2 className={cn("animate-spin text-primary mx-auto mb-4", sizeClasses[size])} />
        {text && (
          <p className="text-muted-foreground text-center">{text}</p>
        )}
      </div>
    </div>
  );
});

export default LoadingSpinner;