import { Building2, Users, Shield, Settings, FileText, Phone, Image, Store, Wrench, Home, Star, Briefcase, LayoutDashboard, UserCheck, ClipboardList, FileSignature, CreditCard, HelpCircle, Map, Newspaper, BookMarked, Camera, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import PageHero from "@/components/shared/PageHero";

const siteStructure = [
  {
    category: "Main Pages",
    icon: Building2,
    pages: [
      { name: "Homepage", path: "/", description: "Welcome page with hero section and features" },
      { name: "About Us", path: "/about", description: "Learn about Monarch Property Management" },
      { name: "Properties", path: "/properties", description: "Browse all available properties" },
      { name: "Services", path: "/services", description: "Property management services" },
      { name: "Property Management", path: "/services/property-management", description: "Full-service property management" },
      { name: "Consultation", path: "/services/consultation", description: "Expert consultation services" },
      { name: "Maintenance", path: "/services/maintenance", description: "Maintenance and repair services" },
      { name: "Gallery", path: "/gallery", description: "Property photos and virtual tours" },
      { name: "Amenities", path: "/amenities", description: "Property amenities showcase" },
      { name: "News & Blog", path: "/news", description: "Industry news and updates" },
      { name: "Contact", path: "/contact", description: "Get in touch with us" }
    ]
  },
  {
    category: "Vendor Services",
    icon: Store,
    pages: [
      { name: "Join as Vendor", path: "/join-as-vendor", description: "Become a Monarch vendor" },
      { name: "Request Quote", path: "/request-quote", description: "Request quotes from vendors" }
    ]
  },
  {
    category: "User & Authentication",
    icon: Users,
    pages: [
      { name: "Sign In / Sign Up", path: "/auth", description: "Login and registration" },
      { name: "Dashboard", path: "/dashboard", description: "User dashboard and overview" },
      { name: "User Settings", path: "/settings", description: "Account settings and preferences" },
      { name: "User Profile", path: "/user-profile", description: "View and edit your profile" },
      { name: "Bookmarks", path: "/bookmarks", description: "Saved articles and resources" }
    ]
  },
  {
    category: "Property Manager Portal",
    icon: LayoutDashboard,
    pages: [
      { name: "Property Dashboard", path: "/dashboard", description: "Property management overview" },
      { name: "Properties", path: "/dashboard/properties", description: "Manage your properties" },
      { name: "Tenants", path: "/dashboard/tenants", description: "Tenant management" },
      { name: "Projects", path: "/dashboard/projects", description: "Project management" },
      { name: "Settings", path: "/dashboard/settings", description: "Dashboard settings" }
    ]
  },
  {
    category: "Vendor Portal",
    icon: Briefcase,
    pages: [
      { name: "Vendor Dashboard", path: "/vendor", description: "Vendor overview and stats" },
      { name: "Vendor Profile", path: "/vendor/profile", description: "Manage your vendor profile" },
      { name: "Projects", path: "/vendor/projects", description: "View and manage projects" },
      { name: "RFQ System", path: "/vendor/rfq", description: "Request for quotes" },
      { name: "Applications", path: "/vendor/applications", description: "Your job applications" },
      { name: "Contracts", path: "/vendor/contracts", description: "Contract management" },
      { name: "Payments", path: "/vendor/payments", description: "Payment history" },
      { name: "Payouts", path: "/vendor/payouts", description: "Payout settings and history" },
      { name: "Documents", path: "/vendor/documents", description: "Document management" },
      { name: "Leads", path: "/vendor/leads", description: "Incoming leads" },
      { name: "Reports", path: "/vendor/reports", description: "Performance reports" },
      { name: "Subscription", path: "/vendor/subscription", description: "Subscription management" },
      { name: "Onboarding", path: "/vendor/onboarding", description: "Complete your vendor setup" }
    ]
  },
  {
    category: "Admin Portal",
    icon: Shield,
    pages: [
      { name: "Admin Dashboard", path: "/admin", description: "Administrative overview" },
      { name: "User Management", path: "/admin/users", description: "Manage system users" },
      { name: "Vendor Management", path: "/admin?tab=vendors", description: "Vendor oversight" },
      { name: "RFQ Management", path: "/admin/rfq", description: "RFQ administration" },
      { name: "Work Orders", path: "/admin/work-orders", description: "Work order management" },
      { name: "Team Management", path: "/admin/team", description: "Staff management" },
      { name: "Tenants", path: "/admin/tenants", description: "Tenant administration" },
      { name: "Invoices", path: "/admin/invoices", description: "Invoice management" },
      { name: "Audit Log", path: "/admin/audit", description: "System audit logs" },
      { name: "Security", path: "/admin/security", description: "Security monitoring" },
      { name: "Monitoring", path: "/admin/monitoring", description: "System health" },
      { name: "Labs", path: "/admin/labs", description: "Experimental features" }
    ]
  },
  {
    category: "Information & Legal",
    icon: FileText,
    pages: [
      { name: "Terms of Service", path: "/terms", description: "Legal terms and conditions" },
      { name: "Privacy Policy", path: "/privacy", description: "Privacy policy and data handling" },
      { name: "Design System", path: "/design-system", description: "Design system showcase" }
    ]
  }
];

export default function Sitemap() {
  const totalPages = siteStructure.reduce((acc, section) => acc + section.pages.length, 0);
  
  return (
    <div className="min-h-screen">
      <main className="p-6">
        <div className="container mx-auto">
          {/* Hero Section */}
          <PageHero
            title="Site Map"
            description="Complete navigation overview of our property management platform"
            icon={Map}
            variant="secondary"
            stats={[
              { label: 'Categories', value: siteStructure.length, icon: Globe, color: 'info' },
              { label: 'Total Pages', value: totalPages, icon: FileText, color: 'success' },
            ]}
          />

          <div className="space-y-8">
            {siteStructure.map((section, index) => (
              <Card key={index} className="neumorphic-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <section.icon className="h-6 w-6 mr-3 text-primary" />
                    {section.category}
                  </CardTitle>
                  <CardDescription>
                    Navigate to any section of our platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.pages.map((page, pageIndex) => (
                      <Link
                        key={pageIndex}
                        to={page.path}
                        className="glass-card p-4 rounded-2xl hover:neumorphic-inset transition-all duration-300 block group"
                      >
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {page.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {page.description}
                        </p>
                        <div className="text-xs text-primary mt-2 opacity-60">
                          {page.path}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center neumorphic-card p-8 rounded-3xl">
            <h2 className="text-2xl font-bold mb-4">Need Help Navigating?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link to="/contact">
              <Button className="btn-primary">
                <Phone className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}