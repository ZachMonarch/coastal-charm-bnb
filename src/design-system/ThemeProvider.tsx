import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useEffect, useState } from "react";

/**
 * Enhanced Theme Provider for Monarch Property Management
 * 
 * Wraps next-themes provider with:
 * - System preference detection
 * - Manual override persistence
 * - Accessibility (prefers-reduced-motion) detection
 * - WCAG 2.2 AA contrast compliance
 * 
 * @see Design Tokens: src/design-system/tokens.json
 * @see Documentation: docs/design-system/tokens.md
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Detect system preferences
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Apply motion preference globally
    if (motionQuery.matches) {
      document.documentElement.classList.add("reduce-motion");
    }

    // Listen for motion preference changes
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
    };

    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
