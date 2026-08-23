import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/OptimizedAuthContext";
import NotificationBell from "@/components/NotificationBell";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Pages that should not show the navbar (like auth pages)
  const hideNavbarRoutes = ['/auth'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);
  
  // Dashboard routes that should use sidebar layout
  const dashboardRoutes = ['/dashboard', '/admin', '/vendor'];
  const isDashboardRoute = dashboardRoutes.some(route => location.pathname.startsWith(route));
  
  // If authenticated and on dashboard route, use sidebar layout
  if (isAuthenticated && isDashboardRoute) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1">
            {/* Global trigger that is ALWAYS visible */}
            <header className="h-12 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger className="ml-2" />
              <div className="flex-1 px-4 flex items-center justify-between">
                <h1 className="text-lg font-semibold">
                  {location.pathname.includes('/admin') ? 'Admin Dashboard' :
                   location.pathname.includes('/vendor') ? 'Vendor Portal' : 'Dashboard'}
                </h1>
                <NotificationBell />
              </div>
            </header>
            <div className="p-4">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Standard layout for public pages with full-width support
  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Skip to main content link for accessibility (single source of truth) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      {shouldShowNavbar && <Navbar />}
      <main id="main-content" className={`w-full ${shouldShowNavbar ? 'pt-20' : ''}`}>
        {children}
      </main>
    </div>
  );
}