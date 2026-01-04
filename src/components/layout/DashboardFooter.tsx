import { Link } from "react-router-dom";
import { 
  Building2, Phone, Mail, MapPin, 
  FileText, Shield, HelpCircle, MessageSquare,
  Wrench, Home, Users, CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { Separator } from "@/components/ui/separator";

interface QuickLink {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function DashboardFooter() {
  const { hasRole } = useAuth();

  // Role-based quick links
  const getQuickLinks = (): QuickLink[] => {
    if (hasRole('admin')) {
      return [
        { title: "Admin Panel", url: "/admin", icon: Shield },
        { title: "Properties", url: "/admin?tab=properties", icon: Building2 },
        { title: "Users", url: "/admin?tab=users", icon: Users },
        { title: "Payments", url: "/admin?tab=payments", icon: CreditCard }
      ];
    }

    if (hasRole('vendor')) {
      return [
        { title: "Dashboard", url: "/vendor", icon: Home },
        { title: "Projects", url: "/vendor/projects", icon: Building2 },
        { title: "RFQs", url: "/vendor/rfq", icon: FileText },
        { title: "Payments", url: "/vendor/payments", icon: CreditCard }
      ];
    }

    if (hasRole('property_manager')) {
      return [
        { title: "Dashboard", url: "/dashboard", icon: Home },
        { title: "Properties", url: "/dashboard/properties", icon: Building2 },
        { title: "Projects", url: "/dashboard/projects", icon: FileText },
        { title: "Tenants", url: "/dashboard/tenants", icon: Users }
      ];
    }

    // Default tenant
    return [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Profile", url: "/dashboard/profile", icon: Users },
      { title: "Settings", url: "/dashboard/settings", icon: Shield }
    ];
  };

  const serviceLinks = [
    { title: "Property Management", url: "/services/property-management", icon: Building2 },
    { title: "Maintenance", url: "/services/maintenance", icon: Wrench },
    { title: "Consultation", url: "/services/consultation", icon: MessageSquare }
  ];

  const supportLinks = [
    { title: "Contact Us", url: "/contact", icon: Phone },
    { title: "FAQ", url: "/faq", icon: HelpCircle },
    { title: "Help Center", url: "/help", icon: MessageSquare }
  ];

  const quickLinks = getQuickLinks();

  return (
    <footer className="mt-12 border-t-2 border-border bg-gradient-to-b from-muted/30 to-muted/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.url}>
                  <Link 
                    to={link.url}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Our Services
            </h3>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.url}>
                  <Link 
                    to={link.url}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  to="/services"
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  View All Services →
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Support
            </h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.url}>
                  <Link 
                    to={link.url}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <a href="tel:+13043658349" className="hover:text-primary transition-colors block">
                    (304) 365-8349
                  </a>
                  <a href="tel:+16144278576" className="hover:text-primary transition-colors block text-xs">
                    (614) 427-8576
                  </a>
                  <p className="text-xs">24/7 Emergency Line</p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <a href="mailto:info@monarchpropertymmgt.com" className="hover:text-primary transition-colors">
                  info@monarchpropertymmgt.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span>West Virginia, USA</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Monarch Property Management</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/accessibility" className="hover:text-primary transition-colors">
              Accessibility
            </Link>
          </div>
          
          <p className="text-xs">
            © {new Date().getFullYear()} Monarch Property Management. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
