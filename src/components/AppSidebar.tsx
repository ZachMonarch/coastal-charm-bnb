import { NavLink, useLocation } from "react-router-dom";
import { 
  Building2, Home, Settings, User, Shield, Zap, Users, FileText, Star, Wrench, 
  BarChart, Plus, Gauge, Search, ClipboardList, CreditCard, FolderOpen, Crown, 
  Files, FileCheck, Beaker, Receipt, Bell, Target, Wallet, UserCheck, Gavel, 
  ListChecks, Newspaper, Building, HardHat, Briefcase, ShieldCheck, Activity, MessageSquare, Mail,
  Palette, Layers
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { cn } from "@/lib/utils";
import OptimizedLogo from "@/components/ui/OptimizedLogo";

// Types for navigation structure
interface NavigationItem {
  title: string;
  url: string;
  icon: string;
  description?: string;
}

interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

// Icon mapping - expanded with all needed icons
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Building2,
  Building,
  Users,
  FileText,
  Shield,
  ShieldCheck,
  Zap,
  Settings,
  User,
  UserCheck,
  Star,
  Wrench,
  BarChart,
  Plus,
  Gauge,
  Search,
  ClipboardList,
  Files,
  CreditCard,
  FolderOpen,
  Crown,
  FileCheck,
  Beaker,
  Receipt,
  Bell,
  Target,
  Wallet,
  Gavel,
  ListChecks,
  Newspaper,
  HardHat,
  Briefcase,
  Activity,
  Palette,
  Layers,
  MessageSquare,
  Mail
};

// Vendor navigation configuration - organized into logical groups
const vendorNavigationConfig: NavigationGroup[] = [
  {
    title: "Navigation",
    items: [
      { title: "Home", url: "/", icon: "Home", description: "Back to main website" },
    ]
  },
  {
    title: "Portal",
    items: [
      { title: "Dashboard", url: "/vendor", icon: "Gauge", description: "Overview of your vendor activities" },
      { title: "Notifications", url: "/vendor/notifications", icon: "Bell", description: "View all notifications" },
      { title: "Messages", url: "/vendor/messages", icon: "MessageSquare", description: "Direct messaging with admin" }
    ]
  },
  {
    title: "Work",
    items: [
      { title: "Leads", url: "/vendor/leads", icon: "Target", description: "View and respond to leads" },
      { title: "Projects", url: "/vendor/projects", icon: "Briefcase", description: "Browse available projects" },
      { title: "Applications", url: "/vendor/applications", icon: "FileText", description: "Manage your project applications" },
      { title: "RFQ Projects", url: "/vendor/rfq", icon: "ClipboardList", description: "View and bid on RFQ projects" },
      { title: "Contracts", url: "/vendor/contracts", icon: "Files", description: "Active project contracts" }
    ]
  },
  {
    title: "Finance",
    items: [
      { title: "Payments", url: "/vendor/payments", icon: "CreditCard", description: "Payment center and invoices" },
      { title: "Payouts", url: "/vendor/payouts", icon: "Wallet", description: "View your payouts" },
      { title: "Payout Settings", url: "/vendor/payout-settings", icon: "Settings", description: "Configure payout preferences" },
      { title: "Subscription", url: "/vendor/subscription", icon: "Crown", description: "Manage subscription plans" }
    ]
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/vendor/profile", icon: "User", description: "Your vendor profile" },
      { title: "Profile Showcase", url: "/vendor/profile-showcase", icon: "Star", description: "Edit your public showcase profile" },
      { title: "Inquiries & Support", url: "/vendor/inquiries", icon: "FileText", description: "Submit inquiries and support requests" },
      { title: "Documents", url: "/vendor/documents", icon: "FolderOpen", description: "Document management" },
      { title: "Reports", url: "/vendor/reports", icon: "BarChart", description: "Analytics and reports" },
      { title: "Settings", url: "/vendor/settings", icon: "Settings", description: "Account settings and preferences" }
    ]
  }
];

// Admin navigation configuration - organized into logical groups without duplicates
const adminNavigationConfig: NavigationGroup[] = [
  {
    title: "Navigation",
    items: [
      { title: "Home", url: "/", icon: "Home", description: "Back to main website" },
    ]
  },
  {
    title: "Dashboard",
    items: [
      { title: "Overview", url: "/dashboard", icon: "Gauge", description: "Dashboard overview" }
    ]
  },
  {
    title: "Admin",
    items: [
      { title: "Admin Panel", url: "/admin", icon: "Shield", description: "Admin control panel" }
    ]
  },
  {
    title: "People",
    items: [
      { title: "Users", url: "/admin?tab=users", icon: "Users", description: "Manage system users" },
      { title: "Vendors", url: "/admin?tab=vendors", icon: "HardHat", description: "Manage vendors" },
      { title: "Vendor Verification", url: "/admin?tab=verification", icon: "UserCheck", description: "Verify vendor credentials" },
      { title: "Team", url: "/admin/team", icon: "Users", description: "Manage team members" }
    ]
  },
  {
    title: "Properties & Work",
    items: [
      { title: "Properties", url: "/admin?tab=properties", icon: "Building2", description: "Admin property management" },
      { title: "Projects", url: "/admin?tab=projects", icon: "Briefcase", description: "Admin project management" },
      { title: "Work Orders", url: "/admin/work-orders", icon: "ListChecks", description: "Manage work orders" }
    ]
  },
  {
    title: "RFQ & Bidding",
    items: [
      { title: "RFQ Management", url: "/admin/rfq", icon: "ClipboardList", description: "Manage RFQ system" },
      { title: "Create RFQ", url: "/admin/rfq/create-detailed", icon: "Plus", description: "Create detailed RFQ project" },
      { title: "Project Access Requests", url: "/admin/rfq-access", icon: "ShieldCheck", description: "Review per-project vendor access requests" },
      { title: "Bids", url: "/admin?tab=bids", icon: "Gavel", description: "Review and manage bids" }
    ]
  },
  {
    title: "Finance",
    items: [
      { title: "Payments & Invoices", url: "/admin?tab=payments", icon: "CreditCard", description: "Manage all payments and invoices" }
    ]
  },
  {
    title: "Content",
    items: [
      { title: "News & Articles", url: "/admin?tab=news", icon: "Newspaper", description: "Manage news content" },
      { title: "Email Templates", url: "/admin?tab=templates", icon: "Mail", description: "Manage email templates" },
      { title: "Newsletter", url: "/admin?tab=newsletter", icon: "Newspaper", description: "Newsletter subscribers" }
    ]
  },
  {
    title: "System",
    items: [
      { title: "Messages", url: "/admin?tab=messages", icon: "MessageSquare", description: "Admin message center" },
      { title: "Approvals", url: "/admin?tab=approvals", icon: "UserCheck", description: "Pending user approvals" },
      { title: "Operations", url: "/admin/operations", icon: "Shield", description: "Admin governance & operations" },
      { title: "Security", url: "/admin?tab=testing", icon: "ShieldCheck", description: "Security command center" },
      { title: "Monitoring", url: "/admin/monitoring", icon: "Activity", description: "System monitoring" },
      { title: "Audit Log", url: "/admin/audit", icon: "FileCheck", description: "View audit logs" },
      { title: "Testing & Labs", url: "/admin/testing", icon: "Beaker", description: "System testing & experimental features" },
      { title: "Design Tokens", url: "/admin/design-tokens", icon: "Palette", description: "Design system tokens" },
      { title: "Component Playground", url: "/admin/component-playground", icon: "Layers", description: "Interactive component testing" }
    ]
  },
  {
    title: "Settings",
    items: [
      { title: "Account Settings", url: "/dashboard/settings", icon: "Settings", description: "Account settings" }
    ]
  }
];

// Property Manager navigation
const propertyManagerNavigationConfig: NavigationGroup[] = [
  {
    title: "Navigation",
    items: [
      { title: "Home", url: "/", icon: "Home", description: "Back to main website" },
    ]
  },
  {
    title: "Dashboard",
    items: [
      { title: "Overview", url: "/dashboard", icon: "Gauge", description: "Dashboard overview" }
    ]
  },
  {
    title: "Property Management",
    items: [
      { title: "Properties", url: "/dashboard/properties", icon: "Building2", description: "Manage properties" },
      { title: "Tenants", url: "/dashboard/tenants", icon: "Users", description: "Manage tenants" },
      { title: "Projects", url: "/dashboard/projects", icon: "FileText", description: "Manage projects" }
    ]
  },
  {
    title: "Account",
    items: [
      { title: "Settings", url: "/dashboard/settings", icon: "Settings", description: "Account settings" }
    ]
  }
];

// Tenant navigation
const tenantNavigationConfig: NavigationGroup[] = [
  {
    title: "Navigation",
    items: [
      { title: "Home", url: "/", icon: "Home", description: "Back to main website" },
    ]
  },
  {
    title: "Dashboard",
    items: [
      { title: "Overview", url: "/dashboard", icon: "Gauge", description: "Dashboard overview" }
    ]
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/dashboard/profile", icon: "User", description: "User profile" },
      { title: "Settings", url: "/dashboard/settings", icon: "Settings", description: "Account settings" }
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab');
  const isCollapsed = state === "collapsed";
  
  const isActive = (path: string) => {
    // Handle paths with query params (tab-based navigation)
    if (path.includes('?tab=')) {
      const [basePath, query] = path.split('?');
      const tabValue = new URLSearchParams(query).get('tab');
      return currentPath === basePath && currentTab === tabValue;
    }
    
    // Exact match for dashboard routes
    if (path === "/dashboard" && currentPath === "/dashboard") return true;
    if (path === "/vendor" && currentPath === "/vendor") return true;
    if (path === "/admin" && currentPath === "/admin" && !currentTab) return true;
    
    // For other routes, check if current path matches exactly or starts with the given path
    if (path !== "/dashboard" && path !== "/vendor" && path !== "/admin") {
      if (currentPath === path) return true;
      if (currentPath.startsWith(path + '/')) return true;
    }
    
    return false;
  };
  
  // Color mapping for navigation groups - uses semantic tokens
  const getGroupIconColor = (groupTitle: string): string => {
    const colorMap: Record<string, string> = {
      'Navigation': 'text-foreground',
      'Dashboard': 'text-primary',
      'Portal': 'text-primary',
      'Admin': 'text-destructive',
      'People': 'text-info',
      'Properties & Work': 'text-secondary',
      'Work': 'text-secondary',
      'RFQ & Bidding': 'text-warning',
      'Finance': 'text-success',
      'Content': 'text-info',
      'System': 'text-warning',
      'Settings': 'text-muted-foreground',
      'Account': 'text-muted-foreground',
      'Property Management': 'text-info',
    };
    return colorMap[groupTitle] || 'text-foreground';
  };

  const getNavCls = ({ isActive, groupTitle }: { isActive: boolean; groupTitle: string }) => {
    if (isActive) {
      // Very subtle faint active state - low opacity background with delicate left border
      return "bg-primary/8 text-primary font-medium border-l-2 border-primary/40";
    }
    const iconColor = getGroupIconColor(groupTitle);
    return `hover:bg-primary/5 ${iconColor} hover:text-primary`;
  };

  // Role-based navigation items
  const getNavigationItems = (): NavigationGroup[] => {
    if (!user) {
      return [];
    }
    
    // Admin navigation
    if (hasRole('admin')) {
      return adminNavigationConfig;
    }

    // Property Manager navigation
    if (hasRole('property_manager')) {
      return propertyManagerNavigationConfig;
    }

    // Vendor navigation
    if (hasRole('vendor')) {
      return vendorNavigationConfig;
    }

    // Default tenant navigation
    return tenantNavigationConfig;
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar 
      className="border-r-2 border-border bg-card shadow-xl z-[10]"
      collapsible="icon"
    >
      <SidebarContent className="bg-card">
        {/* Header */}
        <div className="p-4 border-b-2 border-border bg-primary/5">
          <div className="flex items-center space-x-3">
            <div className="p-1 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shadow-sm">
              <OptimizedLogo size="md" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                  Monarch
                </h2>
                <p className="text-xs font-medium text-muted-foreground -mt-1">Property Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-auto" role="menubar" aria-label="Navigation menu">
          {navigationItems.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No navigation items available
            </div>
          )}
          {navigationItems.map((group, groupIndex) => {
            // Filter items that actually have a URL and title
            const validItems = (group.items || []).filter(item => item?.url && item?.title);
            
            // Only render group if it has valid items
            if (validItems.length === 0) {
              return null;
            }
            
            return (
              <SidebarGroup key={`${group.title}-${groupIndex}`}>
                {!isCollapsed && (
                  <SidebarGroupLabel 
                    className="text-xs font-medium text-primary"
                    id={`nav-group-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {group.title}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu 
                    role="menu" 
                    aria-labelledby={`nav-group-${group.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {validItems.map((item, itemIndex) => {
                      const IconComponent = iconMap[item.icon] || Home;
                      const itemIsActive = isActive(item.url);
                      const iconColor = getGroupIconColor(group.title);
                      return (
                       <SidebarMenuItem key={`${item.title}-${itemIndex}`}>
                          <SidebarMenuButton asChild isActive={itemIsActive} className="text-foreground hover:text-primary">
                            <NavLink 
                              to={item.url} 
                              className={cn(
                                "text-foreground hover:text-primary",
                                getNavCls({ isActive: itemIsActive, groupTitle: group.title }),
                                itemIsActive && "text-primary"
                              )}
                              aria-current={itemIsActive ? "page" : undefined}
                              title={item.description || item.title}
                            >
                              <IconComponent className={`h-4 w-4 ${itemIsActive ? 'text-primary' : iconColor}`} />
                              {!isCollapsed && <span className="ml-3 text-foreground">{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </div>

        {/* Footer Controls - Enhanced visibility for all themes */}
        <div className="p-4 border-t-2 border-border bg-card" data-sidebar="footer">
          <div className={`flex ${isCollapsed ? 'flex-col space-y-3' : 'items-center justify-center gap-3'}`}>
            <div className="rounded-lg border-2 border-primary/50 bg-white dark:bg-card p-1 shadow-sm hover:border-primary transition-colors">
              <ThemeToggle />
            </div>
            <div className="rounded-lg border-2 border-primary/50 bg-white dark:bg-card p-1 shadow-sm hover:border-primary transition-colors">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
