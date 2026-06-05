import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin, Building2, Shield, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import OptimizedLogo from "@/components/ui/OptimizedLogo";

// Footer component 
export default function Footer() {
  const {
    t
  } = useLanguage();
  const {
    isAuthenticated,
    hasRole
  } = useAuth();
  return <footer className="relative bg-gradient-to-b from-background via-accent/5 to-accent/10 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 neumorphic-card rounded-3xl animate-morphic-float" />
        <div className="absolute bottom-20 right-20 w-24 h-24 glass-card rounded-full animate-pulse-glow" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 tech-glow rounded-2xl rotate-45" />
      </div>
      
      <div className="container relative z-10 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Enhanced Company Info */}
          <div className="animate-fade-in [animation-delay:100ms]">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-2xl">
                <OptimizedLogo size="lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">
                  Monarch Property
                </h2>
                <p className="text-sm text-muted-foreground -mt-1">Management Group</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t.home?.welcome?.description1 || "Professional property management services with premium standards and personalized care for your investment properties."}
            </p>
            <div className="flex space-x-4">
              <Button size="icon" variant="outline" className="neumorphic-button hover:text-primary" aria-label="Visit our Facebook page">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="neumorphic-button hover:text-primary" aria-label="Follow us on Twitter">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="neumorphic-button hover:text-primary" aria-label="Follow us on Instagram">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="neumorphic-button hover:text-primary" aria-label="Connect with us on LinkedIn">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fade-in [animation-delay:200ms]">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground">
              <Home className="h-5 w-5 text-primary" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/properties" className="footer-link">
                  Properties
                </Link>
              </li>
              <li>
                <Link to="/services" className="footer-link">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/amenities" className="footer-link">
                  Amenities
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="footer-link">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/news" className="footer-link">
                  News
                </Link>
              </li>
              <li>
                <Link to="/rfq" className="footer-link">
                  Open Projects
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Section - Always Visible */}
          <div className="animate-fade-in [animation-delay:300ms]">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Account
            </h3>
            <ul className="space-y-3">
              {!isAuthenticated ? (
                <>
                  <li>
                    <Link to="/auth" className="footer-link">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/auth?mode=signup" className="footer-link">
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link to="/join-as-vendor" className="footer-link">
                      Join as Vendor
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link 
                      to={hasRole('admin') ? '/admin' : hasRole('vendor') ? '/vendor' : '/dashboard'} 
                      className="footer-link"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to={hasRole('vendor') ? '/vendor/settings' : '/dashboard/settings'} 
                      className="footer-link"
                    >
                      Settings
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard/profile" className="footer-link">
                      Profile
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Admin Links - Only show for authenticated admin users */}
          {isAuthenticated && hasRole('admin') && <div className="animate-fade-in [animation-delay:400ms]">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                Admin Dashboard
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/admin" className="footer-link">
                    Admin Panel
                  </Link>
                </li>
                <li>
                  <Link to="/admin?tab=users" className="footer-link">
                    User Management
                  </Link>
                </li>
                <li>
                  <Link to="/admin?tab=vendors" className="footer-link">
                    Vendor Management
                  </Link>
                </li>
              </ul>
            </div>}

          {/* Contact Info - Show when admin links are not displayed */}
          {!(isAuthenticated && hasRole('admin')) && <div className="animate-fade-in [animation-delay:400ms]">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-foreground">
                <Phone className="h-5 w-5 text-primary" />
                Contact Info
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">2195 N. Highway 83 Suite 14B</p>
                    <p className="text-sm text-muted-foreground">Franktown, CO 80116
United States</p>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href="tel:+13043658349" className="font-medium hover:text-primary transition-colors block py-1">
                      +1 (304) 365-8349
                    </a>
                    <a href="tel:+16144278576" className="block text-sm hover:text-primary transition-colors py-1">
                      +1 (614) 427-8576
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">support@monarchpropertymmgt.online</p>
                  </div>
                </li>
              </ul>
            </div>}
        </div>

        {/* Enhanced Bottom Bar */}
        <div className="pt-8 border-t border-border/30">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Monarch Property Management. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-muted-foreground" aria-hidden="true">•</span>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
                <span className="text-muted-foreground" aria-hidden="true">•</span>
                <Link to="/sitemap" className="hover:text-primary transition-colors">
                  Sitemap
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Professional Property Management Since 2020</span>
            </div>
          </div>
        </div>
      </div>
    </footer>;
}