# Monarch Design System — Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. View the Showcase
Visit the interactive showcase to see all components in action:

**URL**: `/design-system`

Features demonstrated:
- Theme switching (light/dark/system)
- All component variants
- Semantic color system
- Accessibility features
- Responsive layouts

---

## 🎨 Using Design Tokens

### Colors
```tsx
// ✅ CORRECT - Token-driven
<div className="bg-primary text-primary-foreground">
<Button className="bg-success text-success-foreground">Success</Button>

// ❌ WRONG - Hardcoded
<div className="bg-[#E87722] text-white">
```

### Semantic Colors
```tsx
// Success (green) - 4.8:1 contrast
<Alert className="border-success/50 bg-success/10">
  <CheckCircle className="text-success" />
</Alert>

// Warning (amber) - 5.2:1 contrast
<Alert className="border-warning/50 bg-warning/10">
  <AlertTriangle className="text-warning" />
</Alert>

// Error (red) - 4.7:1 contrast
<Alert className="border-error/50 bg-error/10">
  <XCircle className="text-error" />
</Alert>

// Info (blue) - 5.1:1 contrast
<Alert className="border-info/50 bg-info/10">
  <Info className="text-info" />
</Alert>
```

### Spacing
```tsx
// Use Tailwind scale (4px base)
<div className="p-4 md:p-6 lg:p-8">
<div className="space-y-4">
<div className="gap-6">
```

---

## 🧩 Using Components

### HeroBlock
```tsx
import { HeroBlock } from "@/design-system/components/Hero/HeroBlock";
import { Building } from "lucide-react";

<HeroBlock
  variant="image"
  title="Your Amazing Title"
  subtitle="Optional subtitle badge"
  description="Compelling description text"
  media={{
    src: "/path/to/image.webp",
    alt: "Descriptive alt text"
  }}
  cta={{
    primary: {
      text: "Get Started",
      href: "/contact",
      icon: <Building className="mr-2 h-5 w-5" />
    },
    secondary: {
      text: "Learn More",
      href: "/about"
    }
  }}
  stats={[
    { number: "500+", label: "Properties" },
    { number: "98%", label: "Satisfaction" },
  ]}
  height="full"
  overlay
  showScrollIndicator
/>
```

### Card
```tsx
import { Card } from "@/design-system/components/Card/Card";

<Card
  variant="elevated"
  interactive
  equalHeight
  header={<h3 className="text-xl font-semibold">Title</h3>}
  footer={<Button>Action</Button>}
>
  <p>Card content goes here</p>
</Card>
```

### CTABanner
```tsx
import { CTABanner } from "@/design-system/components/CTA/CTABanner";

<CTABanner
  variant="gradient"
  title="Ready to Get Started?"
  description="Join hundreds of satisfied customers"
  primaryCTA={{
    text: "Contact Us",
    href: "/contact"
  }}
  secondaryCTA={{
    text: "Learn More",
    href: "/about"
  }}
/>
```

---

## 🎭 Theme System

### Using Theme Toggle
```tsx
import { useTheme } from "next-themes";

export function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <Button onClick={() => setTheme("light")}>Light</Button>
      <Button onClick={() => setTheme("dark")}>Dark</Button>
      <Button onClick={() => setTheme("system")}>System</Button>
    </div>
  );
}
```

### Theme-Aware Styling
```tsx
// Colors automatically adapt to light/dark mode
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground">
<div className="text-muted-foreground">
```

---

## 📊 Analytics

### Track Events
```tsx
import { analytics } from "@/lib/analytics";

// Track user actions
analytics.trackEvent("hero_cta_click", {
  cta_text: "Get Started",
  page: "/home"
});

// Track form submissions
analytics.trackEvent("form_submit_success", {
  form_type: "contact"
});

// Track page views (automatic)
analytics.trackPageView();
```

### Using the Hook
```tsx
import { useAnalytics } from "@/lib/analytics";

export function MyComponent() {
  const { track } = useAnalytics();

  const handleClick = () => {
    track("button_click", { button_id: "hero-cta" });
  };

  return <Button onClick={handleClick}>Click Me</Button>;
}
```

---

## 🔍 SEO & Structured Data

### Enhanced SEO
```tsx
import { EnhancedSEO } from "@/components/SEO/EnhancedSEO";

export function MyPage() {
  return (
    <>
      <EnhancedSEO
        title="Page Title"
        description="Page description for search engines"
        keywords="property, management, colorado"
        includeOrganizationSchema
      />
      
      <main>
        {/* Your page content */}
      </main>
    </>
  );
}
```

### Structured Data
```tsx
import { FAQPageSchema, RealEstateListingSchema } from "@/components/SEO/StructuredData";

// For FAQ pages
<FAQPageSchema faqs={[
  { question: "Q1?", answer: "A1" },
  { question: "Q2?", answer: "A2" }
]} />

// For property listings
<RealEstateListingSchema
  name="Luxury Apartment"
  description="Modern 2BR apartment"
  image="/property.jpg"
  address={{ street: "123 Main St", city: "Denver", state: "CO", zip: "80202" }}
  price={2500}
  bedrooms={2}
  bathrooms={2}
  floorSize={1200}
/>
```

---

## ♿ Accessibility Guidelines

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Use semantic HTML (`<button>`, `<a>`, `<nav>`)
- Provide visible focus indicators (automatic with design system)

### ARIA Labels
```tsx
// Buttons
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Navigation
<nav aria-label="Main navigation">
  <ul role="menu">
    <li role="menuitem"><a href="/">Home</a></li>
  </ul>
</nav>

// Modals
<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Dialog Title</h2>
</div>
```

### Touch Targets
Ensure all interactive elements are at least 44×44px:

```tsx
<Button className="min-h-[44px] min-w-[44px]">
  <Icon />
</Button>
```

---

## 📱 Responsive Design

### Breakpoints
```tsx
// Mobile-first approach
<div className="text-base md:text-lg lg:text-xl">

// Grid layouts
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Spacing
<section className="py-8 md:py-12 lg:py-16">
```

### Responsive Images
```tsx
<img
  src="/image.webp"
  alt="Description"
  className="w-full h-auto"
  loading="lazy"
  decoding="async"
/>
```

---

## 🔧 Common Patterns

### Loading States
```tsx
import { Skeleton } from "@/components/ui/skeleton";

{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <Content />
)}
```

### Error States
```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>
```

### Empty States
```tsx
<div className="text-center py-12">
  <InboxIcon className="mx-auto h-12 w-12 text-muted-foreground" />
  <h3 className="mt-4 text-lg font-semibold">No items found</h3>
  <p className="mt-2 text-muted-foreground">
    Get started by creating a new item.
  </p>
  <Button className="mt-4">Create Item</Button>
</div>
```

---

## 📚 Additional Resources

### Documentation
- **Token Reference**: `docs/design-system/tokens.md`
- **Component Library**: `docs/design-system/PHASE_2_COMPLETION.md`
- **Verification Report**: `docs/design-system/FINAL_VERIFICATION_REPORT.md`

### Tools
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Accessibility Testing**: https://www.deque.com/axe/devtools/
- **W3C Validator**: https://validator.w3.org/

### Standards
- **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
- **MDN Web Docs**: https://developer.mozilla.org/

---

## 🎉 You're Ready!

The Monarch Design System is production-ready with:
- ✅ 100+ design tokens
- ✅ 10+ accessible components
- ✅ Complete documentation
- ✅ WCAG 2.2 AA compliance
- ✅ Analytics & SEO infrastructure

**Next Steps**:
1. Visit `/design-system` to see components in action
2. Use components in your pages
3. Follow accessibility guidelines
4. Track important user events
5. Deploy with confidence!

---

**Need Help?** Check the comprehensive documentation or contact the development team.
