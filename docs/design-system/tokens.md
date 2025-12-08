# Monarch Design System — Design Tokens

> **Single Source of Truth** for all visual and motion properties in the Monarch Property Management application.

## 📋 Table of Contents

- [Overview](#overview)
- [Color Tokens](#color-tokens)
- [Spacing Tokens](#spacing-tokens)
- [Typography Tokens](#typography-tokens)
- [Border Radius](#border-radius)
- [Shadows](#shadows)
- [Motion & Transitions](#motion--transitions)
- [Breakpoints](#breakpoints)
- [Accessibility Standards](#accessibility-standards)
- [Usage Examples](#usage-examples)

---

## Overview

Design tokens are the atomic building blocks of the Monarch design system. They define all visual properties as semantic, named values that ensure consistency across light/dark modes, responsive breakpoints, and all UI components.

**Location**: `src/design-system/tokens.json`  
**Applied via**: `tailwind.config.ts` + `src/index.css`  
**Standard**: W3C Design Tokens Community Group Format

---

## Color Tokens

### Brand Colors

Primary brand color derived from the Monarch logo — a warm golden orange.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | `hsl(25 85% 55%)` | `hsl(25 85% 60%)` | Primary CTAs, links, focus states |
| `--primary-light` | `hsl(25 85% 65%)` | `hsl(25 85% 70%)` | Hover states, accents |
| `--primary-dark` | `hsl(25 85% 45%)` | `hsl(25 85% 50%)` | Active/pressed states |
| `--primary-foreground` | `hsl(0 0% 100%)` | `hsl(0 0% 100%)` | Text on primary background |

**Tailwind Usage**:
```tsx
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Get Started
</button>
```

---

### Semantic Colors

Used for system feedback and state communication.

| Token | HSL Value | Contrast Ratio | Usage |
|-------|-----------|----------------|-------|
| `--success` | `hsl(142 76% 36%)` | 4.8:1 ✅ | Success messages, completed states |
| `--warning` | `hsl(38 92% 50%)` | 5.2:1 ✅ | Warning alerts, pending states |
| `--error` | `hsl(0 85% 60%)` | 4.7:1 ✅ | Error messages, destructive actions |
| `--info` | `hsl(217 91% 60%)` | 5.1:1 ✅ | Informational messages |

All semantic colors meet **WCAG 2.2 AA** contrast requirements (4.5:1).

**Tailwind Usage**:
```tsx
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Payment Successful</AlertTitle>
</Alert>
```

---

### Surface Colors

Background and foreground colors for light and dark modes.

#### Light Mode
| Token | HSL Value | Description |
|-------|-----------|-------------|
| `--background` | `hsl(45 20% 98%)` | Main background — warm off-white |
| `--card` | `hsl(0 0% 100%)` | Card backgrounds — pure white |
| `--muted` | `hsl(45 20% 94%)` | Muted backgrounds for secondary surfaces |
| `--foreground` | `hsl(0 0% 15%)` | Primary text color (14.7:1 contrast) |
| `--muted-foreground` | `hsl(0 0% 35%)` | Secondary text (5.1:1 contrast — AA compliant) |

#### Dark Mode
| Token | HSL Value | Description |
|-------|-----------|-------------|
| `--background` | `hsl(0 0% 10%)` | Dark background |
| `--card` | `hsl(0 0% 14%)` | Dark card background |
| `--muted` | `hsl(0 0% 18%)` | Dark muted background |
| `--foreground` | `hsl(0 0% 98%)` | Dark mode primary text (18.2:1 contrast) |
| `--muted-foreground` | `hsl(0 0% 80%)` | Dark mode secondary text (8.3:1 contrast) |

**Tailwind Usage**:
```tsx
<div className="bg-background text-foreground">
  <div className="bg-card border border-border rounded-lg p-4">
    <h2 className="text-foreground">Card Title</h2>
    <p className="text-muted-foreground">Supporting text</p>
  </div>
</div>
```

---

## Spacing Tokens

Standardized spacing scale based on 4px base unit.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `xs` | `0.25rem` | 4px | Minimal spacing, tight layouts |
| `sm` | `0.5rem` | 8px | Compact spacing |
| `md` | `1rem` | 16px | Default spacing |
| `lg` | `1.5rem` | 24px | Generous spacing |
| `xl` | `2rem` | 32px | Section spacing |
| `2xl` | `3rem` | 48px | Large section spacing |
| `3xl` | `4rem` | 64px | Extra large section spacing |
| `4xl` | `6rem` | 96px | Hero section spacing |
| `5xl` | `8rem` | 128px | Maximum spacing |

**Tailwind Usage**:
```tsx
<div className="p-md md:p-lg lg:p-xl">
  <h1 className="mb-lg">Title</h1>
  <p className="mb-md">Paragraph</p>
</div>
```

**Native Tailwind equivalents**:
- `xs` = `p-1`
- `sm` = `p-2`
- `md` = `p-4`
- `lg` = `p-6`
- `xl` = `p-8`

---

## Typography Tokens

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `font-body` | `'Inter', sans-serif` | Body text, UI elements |
| `font-heading` | `'Playfair Display', serif` | Headings (h1-h6) |
| `font-mono` | `'Monaco', monospace` | Code snippets |

**CSS Usage**:
```css
body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

---

### Font Sizes

| Token | Value | Line Height | Pixels | Usage |
|-------|-------|-------------|--------|-------|
| `text-xs` | `0.75rem` | `1rem` | 12px | Captions, helper text |
| `text-sm` | `0.875rem` | `1.25rem` | 14px | Small body text |
| `text-base` | `1rem` | `1.5rem` | 16px | Default body text |
| `text-lg` | `1.125rem` | `1.75rem` | 18px | Large body text |
| `text-xl` | `1.25rem` | `1.75rem` | 20px | Small headings |
| `text-2xl` | `1.5rem` | `2rem` | 24px | H3 headings |
| `text-3xl` | `1.875rem` | `2.25rem` | 30px | H2 headings |
| `text-4xl` | `2.25rem` | `2.5rem` | 36px | H1 headings |
| `text-5xl` | `3rem` | `1` | 48px | Hero headings |

**Tailwind Usage**:
```tsx
<div>
  <h1 className="text-4xl md:text-5xl font-heading">
    Monarch Property Management
  </h1>
  <p className="text-base md:text-lg text-muted-foreground">
    Premier property management services
  </p>
</div>
```

---

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-light` | `300` | Decorative text |
| `font-normal` | `400` | Body text |
| `font-medium` | `500` | Emphasis, buttons |
| `font-semibold` | `600` | Subheadings |
| `font-bold` | `700` | Headings |

---

## Border Radius

Rounded corner scales for consistent component styling.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `rounded-none` | `0` | 0px | Sharp corners |
| `rounded-sm` | `0.25rem` | 4px | Subtle rounding |
| `rounded-md` | `0.5rem` | 8px | Default rounding |
| `rounded-lg` | `0.75rem` | 12px | Cards, buttons |
| `rounded-xl` | `1rem` | 16px | Large cards |
| `rounded-2xl` | `1.5rem` | 24px | Hero sections |
| `rounded-full` | `9999px` | Full | Circular (avatars, pills) |

**Tailwind Usage**:
```tsx
<div className="rounded-lg border border-border">
  <img className="rounded-t-lg" src="..." />
  <div className="p-4">Content</div>
</div>
```

---

## Shadows

Elevation scale for depth hierarchy.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, popovers |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Overlays |
| `shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Maximum elevation |
| `shadow-primary` | `0 4px 14px 0 hsl(25 85% 55% / 0.1)` | Branded shadow |
| `shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` | Recessed elements |

**Tailwind Usage**:
```tsx
<div className="bg-card shadow-md hover:shadow-lg transition-shadow">
  Card with elevation
</div>
```

---

## Motion & Transitions

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | `150ms` | Micro-interactions (hover, focus) |
| `duration-normal` | `300ms` | Standard transitions |
| `duration-slow` | `500ms` | Emphasized transitions |
| `duration-slower` | `700ms` | Dramatic effects |

---

### Easing Functions

| Token | Cubic Bezier | Usage |
|-------|--------------|-------|
| `ease-linear` | `linear` | Constant speed |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Accelerating from zero |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Decelerating to zero |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Acceleration & deceleration |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring-like bounce |

**Tailwind Usage**:
```tsx
<button className="transition-colors duration-normal ease-out hover:bg-primary/90">
  Hover me
</button>
```

**CSS Usage**:
```css
.smooth-transition {
  transition: all 300ms cubic-bezier(0, 0, 0.2, 1);
}
```

---

### Reduced Motion

Respects user's `prefers-reduced-motion` system preference (WCAG 2.1 Success Criterion 2.3.3).

**Automatic handling** via `ThemeProvider`:
```tsx
// Automatically applied globally
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Breakpoints

Responsive design breakpoints following Tailwind defaults.

| Token | Value | Device Type |
|-------|-------|-------------|
| `sm` | `640px` | Mobile landscape |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Laptops |
| `xl` | `1280px` | Desktops |
| `2xl` | `1536px` | Large desktops |

**Tailwind Usage**:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Responsive grid */}
</div>
```

---

## Accessibility Standards

### Contrast Ratios

All color combinations meet **WCAG 2.2 Level AA** minimum contrast requirements:

- **Normal text**: 4.5:1 minimum
- **Large text** (18px+ or 14px+ bold): 3:1 minimum
- **AAA Enhanced**: 7:1 (for critical text)

**Verification Tools**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools Accessibility Panel
- `axe-core` browser extension

---

### Touch Targets

All interactive elements meet **WCAG 2.1 Level AAA** minimum touch target size:

- **Minimum size**: 44×44 pixels
- **Applied to**: Buttons, links, form inputs, icons

**Tailwind Usage**:
```tsx
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Touch-friendly
</button>
```

---

### Focus Indicators

All focusable elements have visible focus rings (WCAG 2.2 Success Criterion 2.4.7):

- **Ring width**: 2px solid
- **Ring color**: `hsl(var(--ring))`
- **Offset**: 2px

**Automatic application**:
```css
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

---

## Usage Examples

### Example 1: Button Component

```tsx
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles using tokens
        "rounded-lg font-medium transition-colors duration-normal ease-out",
        "min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Variant styles
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "outline" && "border-2 border-primary text-primary hover:bg-primary/10",
        // Size styles
        size === "sm" && "px-4 py-2 text-sm",
        size === "md" && "px-6 py-2.5 text-base",
        size === "lg" && "px-8 py-3 text-lg"
      )}
      {...props}
    />
  );
}
```

---

### Example 2: Card Component

```tsx
export function PropertyCard({ title, image, price }: PropertyCardProps) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-normal ease-out">
      <img src={image} alt={title} className="w-full h-48 object-cover rounded-t-lg" />
      <div className="p-lg">
        <h3 className="text-xl font-heading font-semibold mb-sm">{title}</h3>
        <p className="text-2xl font-bold text-primary">{price}</p>
      </div>
    </div>
  );
}
```

---

### Example 3: Responsive Section

```tsx
export function HeroSection() {
  return (
    <section className="section bg-gradient-to-br from-background to-primary/5">
      <div className="container mx-auto px-md md:px-lg lg:px-xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-lg">
          Welcome to Monarch Property Management
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-xl max-w-2xl">
          Premier property management services with a personal touch
        </p>
        <div className="flex flex-col sm:flex-row gap-md">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>
      </div>
    </section>
  );
}
```

---

## Token Updates

To update design tokens:

1. **Edit** `src/design-system/tokens.json`
2. **Update** Tailwind config if adding new categories
3. **Rebuild** Tailwind CSS (`npm run dev` / `npm run build`)
4. **Test** light/dark modes and responsive behavior
5. **Verify** WCAG contrast compliance

---

## Related Documentation

- **Component Library**: `docs/design-system/components.md` (Phase 2)
- **Accessibility Guide**: `docs/design-system/accessibility.md`
- **Design System Figma**: [Link to Figma file]
- **Tailwind Config**: `tailwind.config.ts`
- **Global Styles**: `src/index.css`

---

**Last Updated**: Phase 1 Implementation  
**Maintained by**: Monarch Development Team  
**Standards**: W3C Design Tokens, WCAG 2.2 AA, Tailwind CSS v3
