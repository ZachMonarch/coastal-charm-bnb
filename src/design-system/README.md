# Monarch Design System

This directory contains the core design system implementation for Monarch Property Management.

## 📁 Structure

```
src/design-system/
├── tokens.json          # Design token specification (single source of truth)
├── ThemeProvider.tsx    # Enhanced theme provider with system preference detection
├── components/          # Token-driven components (Phase 2)
└── README.md           # This file
```

## 🎨 Design Tokens

The `tokens.json` file defines all visual properties used throughout the application:

- **Colors**: Brand, semantic (success/warning/error/info), surface (light/dark)
- **Spacing**: Standardized scale from 4px to 128px
- **Typography**: Font families, sizes, weights with line heights
- **Border Radius**: Consistent corner rounding scale
- **Shadows**: Elevation system for depth hierarchy
- **Motion**: Duration and easing functions for animations
- **Breakpoints**: Responsive design breakpoints
- **Accessibility**: WCAG 2.2 AA compliance standards

## 🔌 Theme Provider

The `ThemeProvider.tsx` component wraps `next-themes` with enhanced features:

- ✅ System preference detection (`prefers-color-scheme`)
- ✅ Manual theme override persistence
- ✅ Reduced motion detection (`prefers-reduced-motion`)
- ✅ Prevents flash of unstyled content (FOUC)

### Usage

Already integrated in `src/App.tsx`:

```tsx
import { ThemeProvider } from "./design-system/ThemeProvider";

<ThemeProvider>
  <YourApp />
</ThemeProvider>
```

## 📚 Documentation

Comprehensive design token documentation is available at:

**File**: `docs/design-system/tokens.md`

Includes:
- Color swatches with contrast ratios
- Spacing scale visual guide
- Typography examples
- Usage patterns for Tailwind CSS
- Accessibility compliance details
- Component implementation examples

## 🎯 Implementation Status

### ✅ Phase 1: Design Tokens & Theming Foundation (COMPLETE)
- [x] `tokens.json` specification
- [x] Tailwind config integration
- [x] CSS custom properties (light/dark modes)
- [x] Enhanced `ThemeProvider`
- [x] Comprehensive documentation
- [x] Semantic colors (success, warning, error, info)
- [x] Motion tokens (duration, easing)
- [x] Accessibility standards (WCAG 2.2 AA)

### 🚧 Phase 2: Component Library (NEXT)
- [ ] Navigation components (Navbar, Sidebar, Breadcrumbs)
- [ ] Hero blocks with variants
- [ ] Card system (PropertyCard, FeatureCard, etc.)
- [ ] Form components with validation
- [ ] Accordion/FAQ components
- [ ] Tabs with keyboard navigation
- [ ] CTA banners
- [ ] Footer enhancements

### 🔮 Phase 3: CMS & Analytics (FUTURE)
- [ ] Headless CMS integration
- [ ] JSON-LD structured data
- [ ] Analytics instrumentation
- [ ] Cookie consent management
- [ ] Security header hardening

## 🔄 Token Updates

To update design tokens:

1. Edit `tokens.json`
2. Update Tailwind config if adding new categories
3. Rebuild CSS: `npm run dev` or `npm run build`
4. Test light/dark modes
5. Verify WCAG contrast compliance
6. Update documentation

## 🧪 Verification Checklist

Before merging token changes:

- [ ] Light/dark theme toggle works globally
- [ ] All colors meet WCAG 2.2 AA contrast (4.5:1 minimum)
- [ ] Motion respects `prefers-reduced-motion`
- [ ] No console warnings about invalid CSS values
- [ ] Tokens visible in browser DevTools
- [ ] No hardcoded colors in components
- [ ] Documentation updated

## 📖 Related Files

- **Tailwind Config**: `tailwind.config.ts`
- **Global Styles**: `src/index.css`
- **Theme Toggle**: `src/components/ThemeToggle.tsx`
- **Documentation**: `docs/design-system/`

## 🤝 Contributing

When adding new design tokens:

1. Follow the W3C Design Tokens format
2. Add both light and dark mode values
3. Ensure WCAG 2.2 AA contrast compliance
4. Document usage examples
5. Test across all breakpoints
6. Verify accessibility with axe-core

---

**Maintained by**: Monarch Development Team  
**Standards**: W3C Design Tokens, WCAG 2.2 AA, Tailwind CSS v3  
**Last Updated**: Phase 1 Implementation
