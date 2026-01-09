import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import { useSession } from "@/providers/SessionProvider";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface LayoutProps {
  children: ReactNode;
}

export default function OptimizedLayout({ children }: LayoutProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isLoading } = useSession();
  
  // Pages that should not show the navbar (like auth pages)
  const hideNavbarRoutes = ['/auth'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);
  
  // Determine if this is a protected route that needs sidebar
  const isProtectedRoute = 
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/vendor') ||
    location.pathname.startsWith('/project') ||
    location.pathname.startsWith('/rfq');
  
  // CRITICAL: Only block rendering for PROTECTED routes while loading
  // Public routes render immediately - no blocking spinner
  if (isLoading && isProtectedRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  
  const shouldUseSidebar = isAuthenticated && isProtectedRoute;
  
  // If authenticated and should use sidebar, render sidebar layout
  if (shouldUseSidebar) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
            <main id="main-content" role="main" aria-label="Main content" className="flex-1 flex flex-col min-w-0">
            {/* Global header with sidebar trigger - ALWAYS visible and prominent */}
            <header className="sticky top-0 z-[100] h-16 flex items-center border-b border-border bg-card/95 backdrop-blur-sm shadow-md">
              <div className="flex items-center gap-4 px-4 md:px-6 w-full">
                {/* Prominent sidebar trigger button */}
                <SidebarTrigger className="shrink-0 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-accent border-2 border-border transition-all hover:shadow-lg hover:scale-105 bg-background" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-xl font-bold truncate text-foreground">
                    {location.pathname.includes('/admin') ? 'Admin Dashboard' :
                     location.pathname.includes('/vendor') ? 'Vendor Portal' : 'Dashboard'}
                  </h1>
                </div>
                {/* Home button for quick navigation back */}
                <a 
                  href="/" 
                  className="shrink-0 h-9 px-3 flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent border border-border transition-colors"
                  title="Back to Home"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span className="hidden sm:inline">Home</span>
                </a>
              </div>
            </header>
            
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto app-shell">
              <div className="container mx-auto p-4 md:p-6 max-w-7xl">
                {/* Phase 5.1: Add breadcrumb navigation */}
                <Breadcrumbs />
                {children}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Standard layout for public pages with full-width support
  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      {shouldShowNavbar && <Navbar />}
      <main id="main-content" role="main" aria-label="Main content" className={`flex-1 w-full ${shouldShowNavbar ? 'pt-20' : ''}`}>
        {children}
      </main>
    </div>
  );
}