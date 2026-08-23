import React, { ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface A11yProviderProps {
  children: ReactNode;
}

/**
 * A11yProvider - Global Accessibility Enhancements
 * 
 * Features:
 * - Skip-to-main-content link for keyboard users
 * - Focus visible indicators with high contrast
 * - Reduced motion detection
 * - Axe-core accessibility auditing (dev only)
 * - WCAG 2.2 AA compliance utilities
 * 
 * Consolidated from AccessibilityEnhancer + AccessibilityWrapper
 * 
 * @example
 * ```tsx
 * <A11yProvider>
 *   <App />
 * </A11yProvider>
 * ```
 */
export default function A11yProvider({ children }: A11yProviderProps) {
  useEffect(() => {
    // Initialize axe-core in development for accessibility auditing
    if (import.meta.env.DEV) {
      import('@axe-core/react').then((axe) => {
        // Use imported React/ReactDOM to avoid duplicate instances
        axe.default(React, ReactDOM, 1000, {
          rules: [
            { id: 'color-contrast', enabled: true },
            { id: 'link-name', enabled: true },
            { id: 'button-name', enabled: true },
            { id: 'image-alt', enabled: true },
          ],
        });
      }).catch(() => {
        // axe-core not available, continue without it
      });
    }

    // Skip-to-main-content link is rendered declaratively in Layout.tsx.
    // Remove any legacy injected duplicate so only one exists in the DOM.
    document.getElementById('skip-to-main')?.remove();


    // Enhanced focus indicators for keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => {
      if (prefersReducedMotion.matches) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    };

    updateMotionPreference();
    prefersReducedMotion.addEventListener('change', updateMotionPreference);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      prefersReducedMotion.removeEventListener('change', updateMotionPreference);
    };
  }, []);

  return <>{children}</>;
}
