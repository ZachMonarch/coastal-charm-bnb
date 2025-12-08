import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  logo?: ReactNode;
  className?: string;
}

/**
 * MobileDrawer - Reusable off-canvas drawer for mobile navigation
 * 
 * Features:
 * - Slide-in from right with backdrop
 * - Escape key to close
 * - Click outside to close
 * - ARIA attributes for accessibility
 * - Body scroll lock (handled by parent/useDrawer hook)
 * 
 * @example
 * ```tsx
 * const { isOpen, close } = useDrawer();
 * 
 * <MobileDrawer 
 *   isOpen={isOpen} 
 *   onClose={close}
 *   title="Menu"
 *   logo={<img src="/logo.png" alt="Logo" />}
 * >
 *   <nav>...</nav>
 * </MobileDrawer>
 * ```
 */
export default function MobileDrawer({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  logo,
  className 
}: MobileDrawerProps) {
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label={title || "Mobile navigation"}
      className={cn(
        "fixed inset-0 z-[160] backdrop-blur-md lg:hidden transition-all duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-[85%] max-w-sm bg-background border-l border-border shadow-2xl transition-transform duration-300 overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          {(title || logo) && (
            <div className="flex justify-between items-center p-6 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              {logo && <div className="flex items-center space-x-3">{logo}</div>}
              {title && !logo && <span className="font-bold text-lg">{title}</span>}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="border border-primary/20 rounded-lg w-8 h-8 min-h-[44px] min-w-[44px] ml-auto hover:bg-primary/10 hover:text-primary hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
