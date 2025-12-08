import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Building2, Wrench, Phone, LayoutDashboard, LogIn } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/OptimizedAuthContext";

const NotFound = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const { user, isAuthenticated, hasRole } = useAuth();

  // Get role-based dashboard route
  const getRoleBasedDashboard = () => {
    if (hasRole('admin')) return '/admin';
    if (hasRole('vendor')) return '/vendor';
    if (hasRole('property_manager')) return '/dashboard/projects';
    return '/dashboard';
  };

  useEffect(() => {
    // Phase 5.4: Log 404 to audit_logs for analytics
    const log404 = async () => {
      try {
        await supabase.from('audit_logs').insert({
          action: '404_PAGE_NOT_FOUND',
          table_name: 'navigation',
          record_id: location.pathname,
          new_values: { 
            path: location.pathname,
            referrer: document.referrer || 'direct',
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
          },
          user_id: user?.id || null
        });
      } catch (error) {
        console.error('Failed to log 404 to database:', error);
      }
    };
    
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    log404();
  }, [location.pathname, user?.id]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="glass-card p-10 max-w-lg text-center animate-fade-in">
        <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">{t.notFound.title}</h2>
        <p className="text-muted-foreground mb-6">
          {t.notFound.description}
        </p>
        
        {/* Primary action */}
        <Button asChild className="btn-primary mb-6">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            {t.notFound.returnHome}
          </Link>
        </Button>

        {/* Additional navigation options */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/properties">
              <Building2 className="mr-2 h-4 w-4" />
              Properties
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/services">
              <Wrench className="mr-2 h-4 w-4" />
              Services
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/contact">
              <Phone className="mr-2 h-4 w-4" />
              Contact
            </Link>
          </Button>
        </div>

        {/* Role-aware suggestions for authenticated users */}
        {isAuthenticated ? (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-3">Were you looking for:</p>
            <Button asChild size="sm" variant="secondary">
              <Link to={getRoleBasedDashboard()}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Go to Your Dashboard
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-3">Have an account?</p>
            <Button asChild size="sm" variant="secondary">
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          </div>
        )}
      </div>
      
      {/* Decorative waves */}
      <div className="fixed bottom-0 left-0 right-0 h-24 overflow-hidden z-0 pointer-events-none">
        <svg 
          className="absolute bottom-0 w-full h-24 fill-primary/10"
          preserveAspectRatio="none"
          viewBox="0 0 1440 74"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M0,37.1L40,34.5C80,32,160,27,240,29.6C320,32,400,42,480,42.9C560,44,640,35,720,32.1C800,30,880,34,960,40.8C1040,47,1120,56,1200,56.6C1280,57,1360,48,1400,43.3L1440,39.1L1440,74L1400,74C1360,74,1280,74,1200,74C1120,74,1040,74,960,74C880,74,800,74,720,74C640,74,560,74,480,74C400,74,320,74,240,74C160,74,80,74,40,74L0,74Z"
            className="animate-wave opacity-50"
          />
          <path 
            d="M0,37.1L40,34.5C80,32,160,27,240,29.6C320,32,400,42,480,42.9C560,44,640,35,720,32.1C800,30,880,34,960,40.8C1040,47,1120,56,1200,56.6C1280,57,1360,48,1400,43.3L1440,39.1L1440,74L1400,74C1360,74,1280,74,1200,74C1120,74,1040,74,960,74C880,74,800,74,720,74C640,74,560,74,480,74C400,74,320,74,240,74C160,74,80,74,40,74L0,74Z"
            className="animate-wave opacity-100 [animation-delay:-4s]"
          />
        </svg>
      </div>
    </div>
  );
};

export default NotFound;
