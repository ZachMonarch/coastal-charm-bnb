import { useMemo } from "react";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { useLocation } from "react-router-dom";

export interface NavigationItem {
  title: string;
  url: string;
  icon: string; // String icon name that gets mapped to components
  roles?: string[];
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export const useRoleBasedNavigation = () => {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const navigationItems: NavigationGroup[] = useMemo(() => {
    if (!user) return [];

    const baseNavigation = [
      {
        title: "Dashboard",
        items: [
          { title: "Overview", url: "/dashboard", icon: "Home" },
        ],
      },
    ];

    // Admin navigation
    if (hasRole('admin')) {
      return [
        ...baseNavigation,
        {
          title: "Admin System",
          items: [
            { title: "Admin Panel", url: "/admin", icon: "Shield" },
            { title: "User Management", url: "/admin?tab=users", icon: "Users" },
            { title: "Vendor Management", url: "/admin?tab=vendors", icon: "Building2" },
            { title: "Security", url: "/admin?tab=testing", icon: "Shield" },
            { title: "Monitoring", url: "/admin?tab=testing", icon: "Zap" },
          ],
        },
        {
          title: "Property Management",
          items: [
            { title: "Properties", url: "/dashboard/properties", icon: "Building2" },
            { title: "Tenants", url: "/dashboard/tenants", icon: "Users" },
            { title: "Projects", url: "/dashboard/projects", icon: "FileText" },
          ],
        },
        {
          title: "Vendor System",
          items: [
            { title: "RFQ System", url: "/dashboard/rfq-system", icon: "FileText" },
            { title: "Vendors", url: "/dashboard/vendors", icon: "Users" },
          ],
        },
        {
          title: "Account",
          items: [
            { title: "Settings", url: "/dashboard/settings", icon: "Settings" },
          ],
        },
      ];
    }

    // Property Manager navigation
    if (hasRole('property_manager')) {
      return [
        ...baseNavigation,
        {
          title: "Property Management",
          items: [
            { title: "Properties", url: "/dashboard/properties", icon: "Building2" },
            { title: "Tenants", url: "/dashboard/tenants", icon: "Users" },
            { title: "Projects", url: "/dashboard/projects", icon: "FileText" },
          ],
        },
        {
          title: "Account",
          items: [
            { title: "Settings", url: "/dashboard/settings", icon: "Settings" },
          ],
        },
      ];
    }

    // Vendor navigation
    if (hasRole('vendor')) {
      return [
        ...baseNavigation,
        {
          title: "Vendor Portal",
          items: [
            { title: "Vendor Dashboard", url: "/vendor/dashboard", icon: "Wrench" },
            { title: "RFQ System", url: "/dashboard/rfq-system", icon: "FileText" },
            { title: "Subscription", url: "/dashboard/subscription", icon: "Star" },
            { title: "Payments", url: "/dashboard/payments", icon: "Zap" },
            { title: "Performance", url: "/vendor/dashboard?tab=performance", icon: "BarChart" },
          ],
        },
        {
          title: "Account",
          items: [
            { title: "Settings", url: "/dashboard/settings", icon: "Settings" },
          ],
        },
      ];
    }

    // Default tenant navigation
    return [
      ...baseNavigation,
      {
        title: "Account",
        items: [
          { title: "Profile", url: "/dashboard/profile", icon: "User" },
          { title: "Settings", url: "/dashboard/settings", icon: "Settings" },
        ],
      },
    ];
  }, [user, hasRole]);

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  return {
    navigationItems,
    currentPath,
    isActive,
    userRole: user?.role
  };
};