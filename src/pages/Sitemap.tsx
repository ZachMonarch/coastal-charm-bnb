import { Building2, Users, Shield, Settings, FileText, Phone, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const siteStructure = [
  {
    category: "Main Pages",
    icon: Building2,
    pages: [
      { name: "Homepage", path: "/", description: "Welcome page with hero section and features" },
      { name: "Properties", path: "/properties", description: "Browse all available properties" },
      { name: "Apartments", path: "/apartments", description: "Apartment listings and rentals" },
      { name: "Services", path: "/services", description: "Property management services" },
      { name: "Gallery", path: "/gallery", description: "Property photos and virtual tours" },
      { name: "Amenities", path: "/amenities", description: "Property amenities showcase" }
    ]
  },
  {
    category: "User & Authentication",
    icon: Users,
    pages: [
      { name: "Authentication", path: "/auth", description: "Login and registration" },
      { name: "Dashboard", path: "/dashboard", description: "User dashboard and overview" },
      { name: "User Settings", path: "/settings", description: "Account settings and preferences" },
      { name: "Tenant Portal", path: "/tenant-portal", description: "Tenant-specific features" }
    ]
  },
  {
    category: "Booking & Payments",
    icon: FileText,
    pages: [
      { name: "Booking System", path: "/booking", description: "Property booking and scheduling" },
      { name: "Payments", path: "/payments", description: "Payment processing and history" },
      { name: "Subscriptions", path: "/subscriptions", description: "Subscription plans and billing" },
      { name: "Payment Success", path: "/payment-success", description: "Payment confirmation" },
      { name: "Payment Canceled", path: "/payment-canceled", description: "Payment cancellation" }
    ]
  },
  {
    category: "Vendor System",
    icon: Settings,
    pages: [
      { name: "Vendor Onboarding", path: "/vendor-onboarding", description: "New vendor registration" },
      { name: "Vendor Portal", path: "/vendor-portal", description: "Vendor dashboard and projects" },
      { name: "Enhanced RFQ System", path: "/rfq-system", description: "Comprehensive request for quote management" },
      { name: "Vendor Management", path: "/vendor-management", description: "Complete vendor oversight system" }
    ]
  },
  {
    category: "Admin & Management",
    icon: Shield,
    pages: [
      { name: "Admin Dashboard", path: "/admin", description: "Administrative overview" },
      { name: "User Management", path: "/admin/users", description: "Manage system users" },
      { name: "Vendor Management", path: "/admin/vendors", description: "Vendor oversight" },
      { name: "Property Admin", path: "/admin/properties", description: "Property administration" },
      { name: "Project Management", path: "/admin/projects", description: "RFQ and project oversight" },
      { name: "Analytics", path: "/admin/analytics", description: "Business intelligence" },
      { name: "Security Monitoring", path: "/admin/security", description: "System security" }
    ]
  },
  {
    category: "Information & Legal",
    icon: FileText,
    pages: [
      { name: "Contact", path: "/contact", description: "Contact information and forms" },
      { name: "Terms of Service", path: "/terms", description: "Legal terms and conditions" },
      { name: "Privacy Policy", path: "/privacy", description: "Privacy policy and data handling" },
      { name: "Site Map", path: "/sitemap", description: "Complete site navigation overview" }
    ]
  }
];

export default function Sitemap() {
  return (
    <div className="min-h-screen">
      <main className="p-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Site Map
            </h1>
            <p className="text-muted-foreground text-lg">
              Complete navigation overview of our property management platform
            </p>
          </div>

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