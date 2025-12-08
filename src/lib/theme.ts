import designTokens from "@/design-system/tokens.json";

/**
 * Programmatic access to Monarch Design Tokens
 * 
 * Use this utility to access design tokens in JavaScript/TypeScript code.
 * For Tailwind classes, use the tokens directly (e.g., `text-primary`).
 * 
 * @example
 * ```tsx
 * import { tokens } from "@/lib/theme";
 * 
 * <div style={{ backgroundColor: `hsl(${tokens.colors.brand.primary})` }}>
 *   Token-driven background
 * </div>
 * ```
 * 
 * HTML Template → React Token Mapping Guide
 * ==========================================
 * 
 * Use this reference when converting HTML templates to React components:
 * 
 * HTML Template Class           | React/Tailwind Equivalent
 * ------------------------------|---------------------------
 * text-monarch                  | text-primary
 * bg-monarch                    | bg-primary
 * hover:bg-monarch              | hover:bg-primary
 * border-edge-light             | border-border
 * dark:border-edge-dark         | dark:border-border
 * bg-white/80                   | bg-card/80 or bg-popover/95
 * dark:bg-gray-900/80           | dark:bg-card/80
 * bg-white                      | bg-card
 * dark:bg-gray-900              | dark:bg-card
 * text-gray-900                 | text-foreground
 * dark:text-gray-100            | dark:text-foreground
 * text-gray-500                 | text-muted-foreground
 * shadow-card                   | shadow-md or shadow-xl
 * rounded-md                    | rounded-lg (8px)
 * h-16                          | h-16 (64px - standard navbar height)
 * backdrop-blur-md              | backdrop-blur-md (preserved)
 * 
 * Component-Specific Patterns:
 * -----------------------------
 * - Navbar: Use bg-card/95 backdrop-blur-md for glassmorphic effect
 * - Dropdowns: Use bg-popover/95 backdrop-blur-md with z-[200]
 * - Cards: Use bg-card with shadow-md or shadow-xl
 * - Borders: Always use border-border for consistency
 * - Text: Use text-foreground for primary, text-muted-foreground for secondary
 */

export const tokens = {
  colors: {
    brand: {
      primary: designTokens.colors.brand.primary.value,
      primaryLight: designTokens.colors.brand["primary-light"].value,
      primaryDark: designTokens.colors.brand["primary-dark"].value,
      primaryForeground: designTokens.colors.brand["primary-foreground"].value,
    },
    semantic: {
      success: designTokens.colors.semantic.success.value,
      successForeground: designTokens.colors.semantic["success-foreground"].value,
      warning: designTokens.colors.semantic.warning.value,
      warningForeground: designTokens.colors.semantic["warning-foreground"].value,
      error: designTokens.colors.semantic.error.value,
      errorForeground: designTokens.colors.semantic["error-foreground"].value,
      info: designTokens.colors.semantic.info.value,
      infoForeground: designTokens.colors.semantic["info-foreground"].value,
    },
    surface: {
      light: designTokens.colors.surface.light,
      dark: designTokens.colors.surface.dark,
    },
    ui: {
      border: {
        light: designTokens.colors.ui.border.light.value,
        dark: designTokens.colors.ui.border.dark.value,
      },
      input: {
        light: designTokens.colors.ui.input.light.value,
        dark: designTokens.colors.ui.input.dark.value,
      },
      ring: {
        light: designTokens.colors.ui.ring.light.value,
        dark: designTokens.colors.ui.ring.dark.value,
      },
    },
  },
  spacing: designTokens.spacing,
  typography: designTokens.typography,
  borderRadius: designTokens.borderRadius,
  shadow: designTokens.shadow,
  motion: designTokens.motion,
  breakpoints: designTokens.breakpoints,
  accessibility: designTokens.accessibility,
} as const;

/**
 * Convert HSL token value to CSS color
 * @param hslValue - HSL values without wrapping (e.g., "25 85% 55%")
 * @returns Full HSL color string (e.g., "hsl(25 85% 55%)")
 */
export function hslToColor(hslValue: string): string {
  return `hsl(${hslValue})`;
}

/**
 * Get semantic color based on status
 */
export function getSemanticColor(status: "success" | "warning" | "error" | "info"): {
  bg: string;
  fg: string;
} {
  const colorMap = {
    success: {
      bg: tokens.colors.semantic.success,
      fg: tokens.colors.semantic.successForeground,
    },
    warning: {
      bg: tokens.colors.semantic.warning,
      fg: tokens.colors.semantic.warningForeground,
    },
    error: {
      bg: tokens.colors.semantic.error,
      fg: tokens.colors.semantic.errorForeground,
    },
    info: {
      bg: tokens.colors.semantic.info,
      fg: tokens.colors.semantic.infoForeground,
    },
  };
  return colorMap[status];
}

export default tokens;
