import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
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
 * - Rendered via React Portal for guaranteed top-level z-index
 * - Slide-in from right with backdrop
 * - Escape key to close
 * - Click outside to close
 * - Body scroll lock when open
 * - ARIA attributes for accessibility
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

  // Body scroll lock when drawer is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Drawer content to be portaled
  const drawerContent = (
    <div 
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Mobile navigation"}
      className={cn(
        "fixed inset-0 z-[9999] lg:hidden transition-all duration-300",
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer Panel */}
      <div className={cn(
        "fixed inset-y-0 right-0 w-[85%] max-w-sm h-full bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          {(title || logo) && (
            <div className="flex justify-between items-center p-6 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
              {logo && <div className="flex items-center space-x-3">{logo}</div>}
              {title && !logo && <span className="font-bold text-lg text-foreground">{title}</span>}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="border border-primary/20 rounded-lg w-11 h-11 min-h-[44px] min-w-[44px] ml-auto hover:bg-primary/10 hover:text-primary hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level - guarantees z-index works
  return createPortal(drawerContent, document.body);
}
