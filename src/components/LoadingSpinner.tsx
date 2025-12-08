import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function LoadingSpinner({ className, size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

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
}