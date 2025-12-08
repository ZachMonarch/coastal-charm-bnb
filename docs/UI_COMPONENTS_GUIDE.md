# 📘 UI Components Guide — Monarch Property Management

**Version:** 1.0.0  
**Last Updated:** 2025-01-26  
**Status:** Production-Ready

---

## 📋 Table of Contents

1. [Component Hierarchy](#component-hierarchy)
2. [Layout Components](#layout-components)
3. [UI Components](#ui-components)
4. [Hooks](#hooks)
5. [Usage Examples](#usage-examples)
6. [Token System](#token-system)
7. [Accessibility Guidelines](#accessibility-guidelines)
8. [Best Practices](#best-practices)

---

## 🏗️ Component Hierarchy

```
Layout Components (Page Structure)
├── DashboardShell          # Authenticated dashboard wrapper
├── NavDropdown             # Reusable navigation dropdown
└── Navbar (enhanced)       # Main navigation with dropdowns

UI Components (Building Blocks)
├── KPICard                 # Metric display card
├── ChartPlaceholder        # Empty state for charts
└── Button, Card, etc.      # Existing shadcn components

Hooks (Utilities)
├── useDropdown             # Dropdown state management
└── useDrawer               # Drawer state + scroll lock
```

---

## 🎨 Layout Components

### **DashboardShell**

**Purpose:** Authenticated page wrapper with KPI cards and filter bar.

**Location:** `src/components/layout/DashboardShell.tsx`

**Props:**
```typescript
interface DashboardShellProps {
  user: User;                // Required: Current authenticated user
  kpis?: KPI[];              // Optional: Array of KPI metrics
  children: ReactNode;       // Required: Main content area
  filters?: ReactNode;       // Optional: Custom filter buttons
}
```

**Usage:**
```tsx
import DashboardShell from "@/components/layout/DashboardShell";
import { DollarSign, Users } from "lucide-react";

export default function MyDashboard() {
  const { user } = useAuth();
  
  const kpis = [
    {
      label: "Revenue",
      value: "$45,000",
      icon: <DollarSign className="w-5 h-5" />,
      trend: { value: 12.5, direction: "up" }
    },
    {
      label: "Active Users",
      value: "1,234",
      icon: <Users className="w-5 h-5" />
    }
  ];

  return (
    <DashboardShell user={user} kpis={kpis}>
      <div>Your dashboard content here</div>
    </DashboardShell>
  );
}
```

**Features:**
- ✅ Automatic user name extraction (from `user_metadata.full_name` or email)
- ✅ Responsive KPI grid (4 cols desktop → 2 tablet → 1 mobile)
- ✅ Default filter buttons (customizable via `filters` prop)
- ✅ Max-width container with responsive padding

---

### **NavDropdown**

**Purpose:** Accessible dropdown menu for navigation items.

**Location:** `src/components/layout/NavDropdown.tsx`

**Props:**
```typescript
interface NavDropdownProps {
  label: string;              // Required: Trigger button text
  items: NavDropdownItem[];   // Required: Array of menu items
  icon?: ReactNode;           // Optional: Icon next to label
  className?: string;         // Optional: Custom classes
}

interface NavDropdownItem {
  label: string;
  href: string;
  description?: string;       // Optional: Subtitle under label
  icon?: ReactNode;           // Optional: Icon next to label
}
```

**Usage:**
```tsx
import NavDropdown from "@/components/layout/NavDropdown";
import { Building2, Briefcase } from "lucide-react";

const propertiesMenu = [
  { 
    label: "Residential", 
    href: "/properties?type=residential",
    icon: <Building2 className="w-4 h-4" />,
    description: "Homes and apartments"
  },
  { 
    label: "Commercial", 
    href: "/properties?type=commercial",
    icon: <Briefcase className="w-4 h-4" />
  }
];

// In your navbar:
<NavDropdown label="Properties" items={propertiesMenu} />
```

**Features:**
- ✅ Built on Radix UI (fully accessible)
- ✅ Keyboard navigation (Enter/Space/Escape/Arrows)
- ✅ ARIA attributes automatically applied
- ✅ Dark/light mode support
- ✅ Backdrop blur glassmorphic effect
- ✅ z-index [200] for proper layering

**Keyboard Controls:**
- `Enter` / `Space`: Open dropdown
- `Escape`: Close dropdown
- `Arrow Down`: Navigate to next item
- `Arrow Up`: Navigate to previous item

---

## 🧩 UI Components

### **KPICard**

**Purpose:** Display key performance metrics with optional trend indicators.

**Location:** `src/components/ui/KPICard.tsx`

**Props:**
```typescript
interface KPICardProps {
  label: string;              // Required: Metric label
  value: string | number;     // Required: Metric value
  icon?: ReactNode;           // Optional: Icon (top-right)
  trend?: {
    value: number;            // Percentage change
    direction: "up" | "down"; // Trend direction
  };
  className?: string;
}
```

**Usage:**
```tsx
import KPICard from "@/components/ui/KPICard";
import { DollarSign } from "lucide-react";

<KPICard
  label="Monthly Revenue"
  value="$101,490"
  icon={<DollarSign className="w-5 h-5" />}
  trend={{ value: 12.5, direction: "up" }}
/>
```

**Features:**
- ✅ Neumorphic shadow effect
- ✅ Responsive text sizing
- ✅ Color-coded trends (green = up, red = down)
- ✅ Hover state transitions
- ✅ Optional icon with brand color background

---

### **ChartPlaceholder**

**Purpose:** Empty state for chart areas (until real charts are integrated).

**Location:** `src/components/ui/ChartPlaceholder.tsx`

**Props:**
```typescript
interface ChartPlaceholderProps {
  title?: string;             // Optional: Title text
  description?: string;       // Optional: Subtitle text
  icon?: ReactNode;           // Optional: Custom icon
  className?: string;
  height?: string;            // Optional: Tailwind height class
}
```

**Usage:**
```tsx
import ChartPlaceholder from "@/components/ui/ChartPlaceholder";
import { TrendingUp } from "lucide-react";

<ChartPlaceholder
  title="Revenue Chart"
  description="Monthly earnings overview"
  icon={<TrendingUp className="w-10 h-10" />}
  height="h-[400px]"
/>
```

**Features:**
- ✅ Muted aesthetic (doesn't distract from real content)
- ✅ Configurable height via Tailwind classes
- ✅ Custom icon support
- ✅ Centered alignment with proper spacing

---

## 🎣 Hooks

### **useDropdown**

**Purpose:** Manage dropdown open/close state with keyboard support.

**Location:** `src/hooks/useDropdown.ts`

**Returns:**
```typescript
{
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

**Usage:**
```tsx
import useDropdown from "@/hooks/useDropdown";

function MyDropdown() {
  const { isOpen, toggle, close } = useDropdown();

  return (
    <>
      <button onClick={toggle}>Menu</button>
      {isOpen && (
        <div>
          Dropdown content
          <button onClick={close}>Close</button>
        </div>
      )}
    </>
  );
}
```

**Features:**
- ✅ Escape key closes dropdown
- ✅ Automatic event listener cleanup
- ✅ Memoized functions (performance optimized)

---

### **useDrawer**

**Purpose:** Manage drawer state with body scroll lock.

**Location:** `src/hooks/useDrawer.ts`

**Returns:**
```typescript
{
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

**Usage:**
```tsx
import useDrawer from "@/hooks/useDrawer";

function MyDrawer() {
  const { isOpen, open, close } = useDrawer();

  return (
    <>
      <button onClick={open}>Open Drawer</button>
      <div className={isOpen ? "translate-x-0" : "translate-x-full"}>
        Drawer content
      </div>
    </>
  );
}
```

**Features:**
- ✅ Locks body scroll when drawer is open
- ✅ Escape key closes drawer
- ✅ Automatic cleanup on unmount
- ✅ Prevents background scrolling on mobile

---

## 📦 Usage Examples

### **Complete Dashboard Page**

```tsx
import DashboardShell from "@/components/layout/DashboardShell";
import KPICard from "@/components/ui/KPICard";
import ChartPlaceholder from "@/components/ui/ChartPlaceholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/OptimizedAuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  const kpis = [
    {
      label: "Revenue",
      value: "$45,890",
      icon: <DollarSign className="w-5 h-5" />,
      trend: { value: 12.5, direction: "up" as const }
    },
    {
      label: "Users",
      value: "1,234",
      icon: <Users className="w-5 h-5" />
    }
  ];

  return (
    <DashboardShell user={user} kpis={kpis}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder height="h-[300px]" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Active properties: 42
              </p>
              <p className="text-sm text-muted-foreground">
                Pending requests: 8
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
```

---

### **Enhanced Navigation with Dropdowns**

```tsx
import Navbar from "@/components/Navbar";
import NavDropdown from "@/components/layout/NavDropdown";
import { Building2, Briefcase, Wrench } from "lucide-react";

// In your navigation component:
<nav className="hidden lg:flex space-x-1">
  <Link to="/">Home</Link>
  
  <NavDropdown
    label="Properties"
    items={[
      { 
        label: "Residential", 
        href: "/properties/residential",
        icon: <Building2 className="w-4 h-4" />
      },
      { 
        label: "Commercial", 
        href: "/properties/commercial",
        icon: <Briefcase className="w-4 h-4" />
      }
    ]}
  />
  
  <NavDropdown
    label="Services"
    items={[
      { 
        label: "Maintenance", 
        href: "/services/maintenance",
        icon: <Wrench className="w-4 h-4" />,
        description: "24/7 property care"
      }
    ]}
  />
</nav>
```

---

## 🎨 Token System

All components use semantic design tokens from `src/lib/theme.ts` and `tailwind.config.ts`.

### **Core Color Tokens**

```tsx
// Primary brand colors
bg-primary          // Main brand color
text-primary        // Primary text color
hover:bg-primary    // Hover state

// Surface colors
bg-card             // Card backgrounds
bg-popover          // Dropdown/popover backgrounds
bg-background       // Page backgrounds

// Text colors
text-foreground              // Primary text
text-muted-foreground        // Secondary text
text-primary                 // Brand text

// Borders
border-border       // Standard borders

// Semantic colors
text-success / bg-success    // Green for positive states
text-error / bg-error        // Red for errors
text-warning / bg-warning    // Yellow for warnings
text-info / bg-info          // Blue for info
```

### **HTML Template Aliases**

For backward compatibility with HTML templates:

```tsx
// HTML → React Token Mapping
text-monarch         → text-primary
bg-monarch           → bg-primary
border-edge-light    → border-border
bg-white/80          → bg-card/80
shadow-card          → shadow-md
```

**Refer to `src/lib/theme.ts` for complete mapping table.**

---

## ♿ Accessibility Guidelines

All components follow WCAG 2.2 AA standards:

### **Keyboard Navigation**
- All interactive elements are keyboard-accessible
- Tab order is logical and predictable
- Focus indicators are visible (ring-2 ring-primary/60)
- Escape key closes menus/modals

### **ARIA Attributes**
```tsx
// Dropdown triggers
<button aria-haspopup="menu" aria-expanded={isOpen}>

// Dropdown content
<div role="menu" aria-label="Navigation menu">

// Icon buttons
<button aria-label="Toggle theme">

// Modal dialogs
<div role="dialog" aria-modal="true">
```

### **Touch Targets**
- Minimum size: 44px × 44px
- Sufficient spacing between interactive elements
- Hover states also work on touch devices

### **Screen Readers**
- Semantic HTML (`<nav>`, `<main>`, `<header>`)
- `sr-only` class for screen-reader-only content
- Descriptive labels on all interactive elements

---

## 💡 Best Practices

### **Component Composition**

✅ **DO:**
```tsx
// Compose small, focused components
<DashboardShell user={user} kpis={kpis}>
  <MyCustomContent />
</DashboardShell>
```

❌ **DON'T:**
```tsx
// Don't create monolithic components
<GiantDashboardComponent withEverything={true} />
```

---

### **Token Usage**

✅ **DO:**
```tsx
// Use semantic tokens
<div className="bg-card text-foreground border-border">
```

❌ **DON'T:**
```tsx
// Don't hardcode colors
<div className="bg-white text-black border-gray-200">
```

---

### **Responsive Design**

✅ **DO:**
```tsx
// Mobile-first responsive classes
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
```

❌ **DON'T:**
```tsx
// Don't use fixed widths
<div style={{ width: '1200px' }}>
```

---

### **Accessibility**

✅ **DO:**
```tsx
// Provide descriptive labels
<button aria-label="Close navigation menu" onClick={close}>
  <X className="w-4 h-4" />
</button>
```

❌ **DON'T:**
```tsx
// Don't use icon-only buttons without labels
<button onClick={close}>
  <X />
</button>
```

---

## 🔗 Related Documentation

- **Token Mapping:** `src/lib/theme.ts` (comprehensive HTML → React guide)
- **Storybook:** Run `npm run storybook` to view interactive examples
- **HTML Migration:** See `docs/HTML_TO_REACT_MIGRATION.md`
- **Completion Report:** See `docs/UI_INTEGRATION_COMPLETION.md`

---

## 📞 Support

For component-specific questions:
1. Check inline JSDoc comments in source files
2. View Storybook documentation (interactive examples)
3. Refer to this guide for usage patterns
4. Review `UI_INTEGRATION_COMPLETION.md` for implementation details

---

**Last Updated:** 2025-01-26  
**Version:** 1.0.0  
**Status:** ✅ Production-Ready
