import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import OptimizedLogo from "@/components/ui/OptimizedLogo";

interface SidebarLayoutProps {
  children: ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full neumorphic-bg">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Global Header with Sidebar Toggle */}
          <header className="h-20 flex items-center justify-between border-b border-border/50 px-4 md:px-6 neumorphic-card">
            <div className="flex items-center space-x-3 md:space-x-4">
              <SidebarTrigger className="neumorphic-card hover:neumorphic-inset transition-all duration-300 p-2" />
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 md:w-14 md:h-14 neumorphic-card rounded-xl p-1 flex items-center justify-center">
                  <OptimizedLogo size="lg" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                    Monarch Property Management
                  </h1>
                  <p className="text-xs text-muted-foreground">Professional Real Estate Solutions</p>
                </div>
              </div>
            </div>
            {/* ThemeToggle and LanguageSelector moved to AppSidebar footer to avoid duplication */}
          </header>

          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}