import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Building2, Briefcase, Home as HomeIcon, Wrench, FileText, MessageSquare, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import OptimizedUserMenu from "./OptimizedUserMenu";
import NavDropdown from "./layout/NavDropdown";
import MobileDrawer from "./layout/MobileDrawer";
import { Button } from "@/components/ui/button";
import RealtimeNotifications from "./RealtimeNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { rafBatch } from "@/utils/rafBatch";

export default function Navbar() {
  const { t } = useLanguage();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const propertiesDropdownItems = [
    {
      label: "Residential",
      href: "/properties?type=residential",
      icon: <HomeIcon className="w-4 h-4" />,
      description: "Homes and apartments",
    },
    {
      label: "Commercial",
      href: "/properties?type=commercial",
      icon: <Briefcase className="w-4 h-4" />,
      description: "Business properties",
    },
    {
      label: "Luxury",
      href: "/properties?type=luxury",
      icon: <Building2 className="w-4 h-4" />,
      description: "High-end properties",
    },
  ];

  const servicesDropdownItems = [
    {
      label: "Property Management",
      href: "/services/property-management",
      icon: <FileText className="w-4 h-4" />,
      description: "Full-service property care",
    },
    {
      label: "Consultation",
      href: "/services/consultation",
      icon: <MessageSquare className="w-4 h-4" />,
      description: "Expert property advice",
    },
    {
      label: "Maintenance",
      href: "/services/maintenance",
      icon: <Wrench className="w-4 h-4" />,
      description: "Repair and upkeep services",
    },
  ];

  const simpleNavLinks = [
    {
      id: "home",
      name: t.nav.home,
      path: "/",
    },
    {
      id: "gallery",
      name: t.nav.gallery,
      path: "/gallery",
    },
    {
      id: "news",
      name: "News",
      path: "/news",
    },
    {
      id: "contact",
      name: t.nav.contact,
      path: "/contact",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      rafBatch(() => {
        const isScrolled = window.scrollY > 20;
        if (isScrolled !== scrolled) {
          setScrolled(isScrolled);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <>
      {/* Skip to main content - Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[150] transition-all duration-500",
          scrolled
            ? "bg-card shadow-xl border-b-2 border-primary/30 py-3"
            : "bg-card backdrop-blur-md py-5 shadow-md border-b border-border",
        )}
      >
        <nav aria-label="Main navigation" className="container flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 group hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none rounded-lg"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 border-2 border-primary/40 dark:border-primary/50 rounded-xl p-1.5 md:p-2 flex items-center justify-center shadow-md shadow-primary/10 dark:shadow-primary/30 transition-all duration-300">
              {!logoError ? (
                <img
                  src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png"
                  alt="Monarch Property Management Logo"
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <Crown className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              )}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-lg font-semibold text-primary">Monarch Property</span>
              <span className="text-xs text-primary/70 dark:text-primary/60 -mt-1 font-semibold tracking-wide uppercase">
                Management
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex space-x-1 items-center relative z-[200]">
            <li>
              <Link
                to="/"
                className={cn(
                  "px-4 py-2.5 text-base font-bold rounded-lg transition-all duration-200",
                  "text-slate-900 dark:text-slate-100 hover:text-primary hover:bg-primary/5",
                  "relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                  "after:w-0 hover:after:w-3/4 after:h-0.5 after:bg-primary/60 after:transition-all",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                  location.pathname === "/" && "text-primary after:w-3/4",
                )}
              >
                {t.nav.home}
              </Link>
            </li>
            <li>
              <NavDropdown label="Properties" items={propertiesDropdownItems} />
            </li>
            <li>
              <NavDropdown label="Services" items={servicesDropdownItems} />
            </li>
            {simpleNavLinks.slice(1).map((link) => (
              <li key={link.id}>
                <Link
                  to={link.path}
                  className={cn(
                    "px-4 py-2.5 text-base font-bold rounded-lg transition-all duration-200",
                    "text-slate-900 dark:text-slate-100 hover:text-primary hover:bg-primary/5",
                    "relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2",
                    "after:w-0 hover:after:w-3/4 after:h-0.5 after:bg-primary/60 after:transition-all",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                    location.pathname === link.path && "text-primary after:w-3/4",
                  )}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop Tools - lg:flex matches mobile lg:hidden breakpoint */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="rounded-lg border-2 border-primary/60 bg-card p-1.5 shadow-md hover:shadow-lg hover:border-primary transition-all">
              <LanguageSelector />
            </div>
            <div className="rounded-lg border-2 border-primary/60 bg-card p-1.5 shadow-md hover:shadow-lg hover:border-primary transition-all">
              <ThemeToggle />
            </div>
            {isAuthenticated && (
              <div className="rounded-lg border-2 border-primary/60 bg-card p-1.5 shadow-md hover:shadow-lg hover:border-primary transition-all">
                <RealtimeNotifications />
              </div>
            )}
            <div className="rounded-lg border-[3px] border-primary bg-card p-1.5 shadow-lg shadow-primary/15 hover:shadow-xl hover:border-primary transition-all">
              <OptimizedUserMenu />
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center space-x-1.5 md:space-x-2 lg:hidden">
            <div className="rounded-lg border-2 border-primary/40 bg-card/80 p-0.5 md:p-1 shadow-sm">
              <LanguageSelector />
            </div>
            <div className="rounded-lg border-2 border-primary/40 bg-card/80 p-0.5 md:p-1 shadow-sm">
              <ThemeToggle />
            </div>
            {isAuthenticated && (
              <div className="rounded-lg border-2 border-primary/40 bg-card/80 p-0.5 md:p-1 shadow-sm">
                <RealtimeNotifications />
              </div>
            )}
            {!isLoading && !isAuthenticated && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-semibold"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
            {isAuthenticated && (
              <div className="rounded-lg border-2 border-primary/40 bg-card/80 p-1 shadow-sm">
                <OptimizedUserMenu />
              </div>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative z-[160] border-2 border-primary bg-background/95 rounded-lg w-10 h-10 min-h-[40px] min-w-[40px] hover:bg-primary/10 hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-md"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-primary" /> : <Menu className="h-5 w-5 text-primary" />}
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer - OUTSIDE header for correct z-index stacking */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu"
        logo={
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 border-2 border-primary/40 dark:border-primary/50 rounded-xl p-2 flex items-center justify-center shadow-md shadow-primary/10 dark:shadow-primary/30">
              {!logoError ? (
                <img
                  src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png"
                  alt="Monarch Logo"
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Crown className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
                Monarch
              </span>
              <span className="text-xs text-primary/70 dark:text-primary/60 -mt-1 font-semibold tracking-wide uppercase">
                Property Mgmt
              </span>
            </div>
          </div>
        }
      >
        {/* Loading state during auth initialization */}
        {isLoading && (
          <div className="p-4 flex justify-center border-b border-border bg-card">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Sign In / Sign Up buttons - visible for guests only (when not loading and not authenticated) */}
        {!isLoading && !isAuthenticated && (
          <div className="p-4 space-y-3 border-b border-border bg-card">
            <p className="text-sm text-foreground font-medium text-center mb-2">
              Join Monarch Property Management
            </p>
            <Button
              asChild
              className="w-full h-12 bg-primary font-semibold text-base shadow-md hover:bg-primary-dark hover:shadow-lg transition-all text-white"
            >
              <Link 
                to="/auth?tab=register" 
                onClick={() => setMobileMenuOpen(false)}
                className="!text-white"
              >
                Join Now
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full h-12 border-2 border-primary font-semibold text-base bg-card hover:bg-primary hover:border-primary transition-all"
            >
              <Link 
                to="/auth" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground hover:!text-white"
              >
                Sign In
              </Link>
            </Button>
          </div>
        )}

        {/* Quick account actions for signed-in users */}
        {!isLoading && isAuthenticated && (
          <section className="px-6 pt-4 pb-4 border-b border-border bg-card">
            <p className="text-sm font-medium text-foreground mb-2">
              Signed in as {user?.email}
            </p>
            <Button
              variant="destructive"
              className="w-full h-11 font-semibold"
              onClick={async () => {
                await signOut();
                setMobileMenuOpen(false);
              }}
            >
              Sign Out
            </Button>
          </section>
        )}

        {/* Navigation Links */}
        <nav className="p-6" aria-label="Mobile navigation">
          <ul className="space-y-2" role="list">
            <li>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-4 py-3 text-base font-medium rounded-lg border-l-4 transition-all",
                  "text-foreground hover:border-primary/80 hover:bg-muted hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                  location.pathname === "/" ? "border-primary/80 bg-muted text-foreground" : "border-transparent",
                )}
              >
                {t.nav.home}
              </Link>
            </li>

            {/* Properties Dropdown */}
            <li>
              <details className="group rounded bg-muted/30">
                <summary className="cursor-pointer px-4 py-3 text-base font-semibold text-foreground bg-card rounded-lg flex items-center justify-between shadow-sm border border-border hover:bg-muted hover:text-foreground transition-colors duration-200">
                  <span>Properties</span>
                  <X className="w-4 h-4 rotate-45 group-open:rotate-0 transition-transform text-muted-foreground" />
                </summary>
                <div className="ml-4 mt-2 space-y-1 bg-card rounded-lg p-2">
                  {propertiesDropdownItems.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.href}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground font-medium hover:text-primary hover:bg-muted rounded-lg transition-colors border-l-2 border-transparent hover:border-primary/80"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-primary">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </details>
            </li>

            {/* Services Dropdown */}
            <li>
              <details className="group rounded bg-muted/30">
                <summary className="cursor-pointer px-4 py-3 text-base font-semibold text-foreground bg-card rounded-lg flex items-center justify-between shadow-sm border border-border hover:bg-muted hover:text-foreground transition-colors duration-200">
                  <span>Services</span>
                  <X className="w-4 h-4 rotate-45 group-open:rotate-0 transition-transform text-muted-foreground" />
                </summary>
                <div className="ml-4 mt-2 space-y-1 bg-card rounded-lg p-2">
                  {servicesDropdownItems.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.href}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground font-medium hover:text-primary hover:bg-muted rounded-lg transition-colors border-l-2 border-transparent hover:border-primary/80"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-primary">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </details>
            </li>

            {simpleNavLinks.slice(1).map((link) => (
              <li key={link.id}>
                <Link
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 text-base font-medium rounded-lg border-l-4 transition-all",
                    "text-foreground hover:border-primary/80 hover:bg-muted hover:text-foreground",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                    location.pathname === link.path ? "border-primary/80 bg-muted text-foreground" : "border-transparent",
                  )}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Menu - only for authenticated users */}
        {isAuthenticated && (
          <div className="p-6 border-t border-border bg-card">
            <OptimizedUserMenu />
          </div>
        )}
      </MobileDrawer>
    </>
  );
}
