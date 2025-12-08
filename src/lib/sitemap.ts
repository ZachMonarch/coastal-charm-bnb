export interface SiteMapItem {
  path: string;
  label: string;
  description?: string;
  role?: string | string[];
  icon?: string;
  parent?: string;
}

export const sitemap: SiteMapItem[] = [
  // Public Routes
  { path: "/", label: "Home", description: "Monarch Property Management homepage", icon: "Home" },
  { path: "/properties", label: "Properties", description: "Browse available properties", icon: "Building2" },
  { path: "/services", label: "Services", description: "Our property management services", icon: "Wrench" },
  { path: "/gallery", label: "Gallery", description: "Property photos and tours", icon: "Image" },
  { path: "/amenities", label: "Amenities", description: "Luxury amenities and features", icon: "Star" },
  { path: "/contact", label: "Contact", description: "Get in touch with us", icon: "Mail" },
  
  // Auth
  { path: "/auth", label: "Login", description: "Sign in to your account", icon: "LogIn" },
  
  // Tenant Dashboard
  { path: "/dashboard", label: "Dashboard", description: "Tenant dashboard", role: "tenant", icon: "LayoutDashboard" },
  { path: "/dashboard/maintenance", label: "Maintenance", description: "Submit requests", role: "tenant", icon: "Wrench", parent: "/dashboard" },
  { path: "/dashboard/payments", label: "Payments", description: "Payment history", role: "tenant", icon: "DollarSign", parent: "/dashboard" },
  { path: "/dashboard/documents", label: "Documents", description: "Your documents", role: "tenant", icon: "FileText", parent: "/dashboard" },
  
  // Vendor Portal
  { path: "/vendor", label: "Vendor Dashboard", description: "Vendor overview", role: "vendor", icon: "LayoutDashboard" },
  { path: "/vendor/projects", label: "Projects", description: "Your projects", role: "vendor", icon: "Briefcase", parent: "/vendor" },
  { path: "/vendor/rfq", label: "RFQs", description: "Browse opportunities", role: "vendor", icon: "FileText", parent: "/vendor" },
  { path: "/vendor/contracts", label: "Contracts", description: "Active contracts", role: "vendor", icon: "FileCheck", parent: "/vendor" },
  { path: "/vendor/payments", label: "Payment Requests", description: "Payment requests", role: "vendor", icon: "DollarSign", parent: "/vendor" },
  { path: "/vendor/payouts", label: "Payouts", description: "Payout history", role: "vendor", icon: "CreditCard", parent: "/vendor" },
  { path: "/vendor/payout-settings", label: "Payout Settings", description: "Configure payout details", role: "vendor", icon: "Settings", parent: "/vendor" },
  { path: "/vendor/documents", label: "Documents", description: "Upload documents", role: "vendor", icon: "Upload", parent: "/vendor" },
  { path: "/vendor-onboarding/profile", label: "Onboarding", description: "Complete vendor onboarding", role: "vendor", icon: "UserPlus" },
  
  // Universal Payments (All Users)
  { path: "/payments", label: "My Payments", description: "View and manage payments", role: ["admin", "property_manager", "vendor", "tenant"], icon: "Wallet" },
  
  // Admin Portal
  { path: "/admin", label: "Admin Dashboard", description: "Admin overview", role: "admin", icon: "Shield" },
  { path: "/admin/users", label: "Users", description: "User management", role: "admin", icon: "Users", parent: "/admin" },
  { path: "/admin/vendors", label: "Vendors", description: "Vendor management", role: "admin", icon: "Wrench", parent: "/admin" },
  { path: "/admin/properties", label: "Properties", description: "Property management", role: "admin", icon: "Building2", parent: "/admin" },
  { path: "/admin/projects", label: "Projects", description: "Project management", role: "admin", icon: "Briefcase", parent: "/admin" },
  { path: "/admin/rfq", label: "RFQ System", description: "Manage RFQs", role: "admin", icon: "FileText", parent: "/admin" },
  { path: "/admin/work-orders", label: "Work Orders", description: "Service requests", role: "admin", icon: "ClipboardList", parent: "/admin" },
  { path: "/admin/payment-management", label: "Payment Management", description: "Manage all payments, payouts, and refunds", role: "admin", icon: "DollarSign", parent: "/admin" },
  { path: "/admin/tenants", label: "Tenants", description: "Tenant management", role: "admin", icon: "Users", parent: "/admin" },
  { path: "/admin/invoices", label: "Invoices", description: "Invoice management", role: "admin", icon: "Receipt", parent: "/admin" },
  { path: "/admin/security", label: "Security", description: "Security settings", role: "admin", icon: "Shield", parent: "/admin" },
  { path: "/admin/audit", label: "Audit Log", description: "System audit trail", role: "admin", icon: "ScrollText", parent: "/admin" },
  { path: "/admin/monitoring", label: "Monitoring", description: "System monitoring", role: "admin", icon: "Activity", parent: "/admin" },
];

export function getSiteMapByRole(role?: string): SiteMapItem[] {
  if (!role) return sitemap.filter(item => !item.role);
  
  return sitemap.filter(item => {
    if (!item.role) return false;
    if (Array.isArray(item.role)) {
      return item.role.includes(role);
    }
    return item.role === role || role === 'admin';
  });
}

export function getBreadcrumbs(currentPath: string): SiteMapItem[] {
  const breadcrumbs: SiteMapItem[] = [];
  const currentItem = sitemap.find(item => item.path === currentPath);
  
  if (currentItem) {
    if (currentItem.parent) {
      const parentItem = sitemap.find(item => item.path === currentItem.parent);
      if (parentItem) {
        breadcrumbs.push(parentItem);
      }
    }
    breadcrumbs.push(currentItem);
  }
  
  return breadcrumbs;
}
