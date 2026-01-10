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
  useEffect(() => {
    // Detect and apply motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    if (motionQuery.matches) {
      document.documentElement.classList.add("reduce-motion");
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("reduce-motion", e.matches);
    };

    motionQuery.addEventListener("change", handleMotionChange);
    return () => motionQuery.removeEventListener("change", handleMotionChange);
  }, []);

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
