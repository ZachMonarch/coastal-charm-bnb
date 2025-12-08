import { useState, useEffect, useCallback } from "react";

interface UseDropdownReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing dropdown state with keyboard support
 * 
 * Features:
 * - Open/close/toggle controls
 * - Escape key to close
 * - Automatic cleanup
 * 
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useDropdown();
 * 
 * <button onClick={toggle}>Menu</button>
 * {isOpen && <div>Content</div>}
 * ```
 */
export default function useDropdown(): UseDropdownReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

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
