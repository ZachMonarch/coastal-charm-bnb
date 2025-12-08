import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Building2, Briefcase, Home as HomeIcon, Wrench, FileText, MessageSquare, Crown } from "lucide-react";
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
  const {
    t
  } = useLanguage();
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    signOut
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const propertiesDropdownItems = [{
    label: "Residential",
    href: "/properties?type=residential",
    icon: <HomeIcon className="w-4 h-4" />,
    description: "Homes and apartments"
  }, {
    label: "Commercial",
    href: "/properties?type=commercial",
    icon: <Briefcase className="w-4 h-4" />,
    description: "Business properties"
  }, {
    label: "Luxury",
    href: "/properties?type=luxury",
    icon: <Building2 className="w-4 h-4" />,
    description: "High-end properties"
  }];
  const servicesDropdownItems = [{
    label: "Property Management",
    href: "/services/property-management",
    icon: <FileText className="w-4 h-4" />,
    description: "Full-service property care"
  }, {
    label: "Consultation",
    href: "/services/consultation",
    icon: <MessageSquare className="w-4 h-4" />,
    description: "Expert property advice"
  }, {
    label: "Maintenance",
    href: "/services/maintenance",
    icon: <Wrench className="w-4 h-4" />,
    description: "Repair and upkeep services"
  }];
  const simpleNavLinks = [{
    id: "home",
    name: t.nav.home,
    path: "/"
  }, {
    id: "gallery",
    name: t.nav.gallery,
    path: "/gallery"
  }, {
    id: "news",
    name: "News",
    path: "/news"
  }, {
    id: "contact",
    name: t.nav.contact,
    path: "/contact"
  }];
  useEffect(() => {
    const handleScroll = () => {
      rafBatch(() => {
        const isScrolled = window.scrollY > 20;
        if (isScrolled !== scrolled) {
          setScrolled(isScrolled);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, {
      passive: true
    });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);
  return <>
      {/* Skip to main content - Accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2">
        Skip to main content
      </a>

      <header className={cn("fixed top-0 left-0 right-0 z-[150] transition-all duration-500", scrolled ? "bg-card dark:bg-card shadow-xl border-b-2 border-primary/30 py-3" : "bg-card/98 dark:bg-card/98 backdrop-blur-md py-5 shadow-md border-b border-primary/20")}>
        <nav className="container flex justify-between items-center text-foreground">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 border-2 border-primary/40 dark:border-primary/50 rounded-xl p-2 flex items-center justify-center shadow-md shadow-primary/10 dark:shadow-primary/30 transition-all duration-300">
              {!logoError ? <img src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png" alt="Monarch Property Management Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} loading="eager" decoding="async" /> : <Crown className="h-6 w-6 text-primary" />}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-lg bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-amber-600 font-semibold">
                Monarch Property
              </span>
              <span className="text-xs text-primary/70 dark:text-primary/60 -mt-1 font-semibold tracking-wide uppercase">Management</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex space-x-1 items-center relative z-[200]">
            <li>
              <Link to="/" className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200", "text-foreground hover:text-primary hover:bg-primary/5", "relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2", "after:w-0 hover:after:w-3/4 after:h-0.5 after:bg-primary after:transition-all", "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none", location.pathname === "/" && "text-primary after:w-3/4")}>
                {t.nav.home}
              </Link>
            </li>
            <li>
              <NavDropdown label="Properties" items={propertiesDropdownItems} />
            </li>
            <li>
              <NavDropdown label="Services" items={servicesDropdownItems} />
            </li>
            {simpleNavLinks.slice(1).map(link => <li key={link.id}>
                <Link to={link.path} className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200", "text-foreground hover:text-primary hover:bg-primary/5", "relative after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2", "after:w-0 hover:after:w-3/4 after:h-0.5 after:bg-primary after:transition-all", "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none", location.pathname === link.path && "text-primary after:w-3/4")}>
                  {link.name}
                </Link>
              </li>)}
          </ul>

          <div className="hidden md:flex items-center space-x-3">
            <LanguageSelector />
            <ThemeToggle />
            {isAuthenticated && <RealtimeNotifications />}
            <OptimizedUserMenu />
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center space-x-2 lg:hidden">
            <LanguageSelector />
            {isAuthenticated && <RealtimeNotifications />}
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="border-primary/30 rounded-lg w-10 h-10 min-h-[44px] min-w-[44px] hover:bg-primary/10 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-menu">
              {mobileMenuOpen ? <X className="h-4 w-4 text-primary" /> : <Menu className="h-4 w-4 text-primary" />}
            </Button>
          </div>
        </nav>

        {/* Mobile Menu using extracted MobileDrawer */}
        <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} title="Menu" logo={<div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 border-2 border-primary/40 dark:border-primary/50 rounded-xl p-2 flex items-center justify-center shadow-md shadow-primary/10 dark:shadow-primary/30">
                {!logoError ? <img src="/lovable-uploads/318cdd13-7256-4cfe-99e0-948e43902b7b.png" alt="Monarch Logo" className="w-full h-full object-contain" onError={() => setLogoError(true)} /> : <Crown className="h-5 w-5 text-primary" />}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">Monarch</span>
                <span className="text-xs text-primary/70 dark:text-primary/60 -mt-1 font-semibold tracking-wide uppercase">Property Mgmt</span>
              </div>
            </div>}>
          {/* Navigation Links */}
          <nav className="p-6" aria-label="Mobile navigation">
            <ul className="space-y-2" role="list">
              <li>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className={cn("block px-4 py-3 text-base font-medium rounded-lg border-l-4 transition-all", "hover:border-primary hover:bg-primary/5 hover:text-primary", "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none", location.pathname === "/" ? "border-primary bg-primary/5 text-primary" : "border-transparent")}>
                  {t.nav.home}
                </Link>
              </li>
              
              {/* Properties Dropdown */}
              <li>
                <details className="group rounded">
                  <summary className="cursor-pointer px-4 py-3 text-base font-medium transition-colors duration-200 hover:text-primary hover:bg-primary/5 rounded-lg flex items-center justify-between">
                    <span>Properties</span>
                    <X className="w-4 h-4 rotate-45 group-open:rotate-0 transition-transform text-primary" />
                  </summary>
                  <div className="ml-4 mt-1 space-y-1">
                    {propertiesDropdownItems.map((item, idx) => <Link key={idx} to={item.href} className="flex items-center gap-2 px-4 py-2 text-sm hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border-l-2 border-transparent hover:border-primary" onClick={() => setMobileMenuOpen(false)}>
                        <span className="text-primary">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>)}
                  </div>
                </details>
              </li>

              {/* Services Dropdown */}
              <li>
                <details className="group rounded">
                  <summary className="cursor-pointer px-4 py-3 text-base font-medium transition-colors duration-200 hover:text-primary hover:bg-primary/5 rounded-lg flex items-center justify-between">
                    <span>Services</span>
                    <X className="w-4 h-4 rotate-45 group-open:rotate-0 transition-transform text-primary" />
                  </summary>
                  <div className="ml-4 mt-1 space-y-1">
                    {servicesDropdownItems.map((item, idx) => <Link key={idx} to={item.href} className="flex items-center gap-2 px-4 py-2 text-sm hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border-l-2 border-transparent hover:border-primary" onClick={() => setMobileMenuOpen(false)}>
                        <span className="text-primary">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>)}
                  </div>
                </details>
              </li>

              {simpleNavLinks.slice(1).map(link => <li key={link.id}>
                  <Link to={link.path} onClick={() => setMobileMenuOpen(false)} className={cn("block px-4 py-3 text-base font-medium rounded-lg border-l-4 transition-all", "hover:border-primary hover:bg-primary/5 hover:text-primary", "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none", location.pathname === link.path ? "border-primary bg-primary/5 text-primary" : "border-transparent")}>
                    {link.name}
                  </Link>
                </li>)}
            </ul>
          </nav>
          
          {/* User Menu */}
          <div className="p-6 border-t border-primary/20">
            <OptimizedUserMenu />
          </div>
        </MobileDrawer>
      </header>
    </>;
}