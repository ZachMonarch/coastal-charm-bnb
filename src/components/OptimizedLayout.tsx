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
  const { session, isLoading } = useSession();
  
  // Pages that should not show the navbar (like auth pages)
  const hideNavbarRoutes = ['/auth'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);
  
  // Public routes that should NOT use sidebar even when authenticated
  const publicRoutes = ['/', '/auth', '/privacy', '/terms', '/sitemap', '/vendors/showcase', '/vendors', '/join-as-vendor', '/request-quote'];
  
  // Determine if sidebar should show: authenticated AND (route starts with protected prefix OR not in public list)
  const isProtectedRoute = 
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/vendor') ||
    location.pathname.startsWith('/project') ||
    location.pathname.startsWith('/rfq');
  
  const shouldUseSidebar = isAuthenticated && isProtectedRoute && !isLoading;
  
  // Show loading state while session is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  
  // If authenticated and should use sidebar, render sidebar layout
  if (shouldUseSidebar) {
    return (
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-w-0">
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
      {shouldShowNavbar && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navbar />
        </div>
      )}
      <main className={`flex-1 w-full ${shouldShowNavbar ? 'pt-20' : ''}`}>
        {children}
      </main>
    </div>
  );
}