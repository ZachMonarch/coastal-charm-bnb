import { useState, useEffect, useCallback } from "react";

interface UseDrawerReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing drawer state with body scroll lock
 * 
 * Features:
 * - Open/close/toggle controls
 * - Body scroll lock when open
 * - Escape key to close
 * - Automatic cleanup
 * 
 * @example
 * ```tsx
 * const { isOpen, open, close } = useDrawer();
 * 
 * <button onClick={open}>Open Drawer</button>
 * <Drawer isOpen={isOpen} onClose={close}>Content</Drawer>
 * ```
 */
export default function useDrawer(): UseDrawerReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll
      document.body.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, close]);

  return { isOpen, open, close, toggle };
}
