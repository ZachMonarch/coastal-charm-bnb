import { lazy, Suspense, useEffect, type ReactNode } from "react";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { SpeedInsights } from "@vercel/speed-insights/react";

import appCss from "../styles.css?url";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/design-system/ThemeProvider";
import { SecurityHeaders } from "@/components/SecurityHeaders";
import { OptimizedSecurityProvider } from "@/components/OptimizedSecurityProvider";
import OptimizedLayout from "@/components/OptimizedLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import SalesIQProvider from "@/components/SalesIQProvider";
import UnifiedPerformanceMonitor from "@/components/UnifiedPerformanceMonitor";
import A11yProvider from "@/providers/A11yProvider";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { SessionProvider } from "@/providers/SessionProvider";
import { AuthProvider } from "@/contexts/OptimizedAuthContext";
import NotFound from "@/pages/NotFound";

const CommandPalette = lazy(() => import("@/components/CommandPalette"));

const SITE_TITLE = "Monarch Property Management — Modern Platform";
const SITE_DESCRIPTION =
  "Property management platform for tenants, vendors, projects, maintenance, and payments — built for real estate professionals.";
const SOCIAL_TITLE = "Monarch Property Management — Property & Vendor Services";
const SOCIAL_DESCRIPTION =
  "Manage your properties and connect with verified vendors. Streamline operations with our property management platform.";
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&display=swap";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "UTF-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover",
      },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "property management, real estate, tenant management, vendor coordination, maintenance tracking, payment processing, property analytics",
      },
      { name: "author", content: "Monarch Properties" },
      { name: "robots", content: "index, follow" },
      { name: "google-site-verification", content: "0RWswY2Dsijf9vYpPZJJvr1TXNedi-ia6iALZ92o40w" },
      { name: "theme-color", content: "#1a1a1a" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: SOCIAL_TITLE },
      { property: "og:description", content: SOCIAL_DESCRIPTION },
      { property: "og:url", content: "https://monarchpropertymmgt.com" },
      { property: "og:site_name", content: "Monarch Property Management" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SOCIAL_TITLE },
      { name: "twitter:description", content: SOCIAL_DESCRIPTION },
    ],
    links: [
      { rel: "preconnect", href: "https://yhegaaqxmuhszesbjtdo.supabase.co", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://fonts.googleapis.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://yhegaaqxmuhszesbjtdo.supabase.co" },
      { rel: "dns-prefetch", href: "https://images.unsplash.com" },
      { rel: "dns-prefetch", href: "https://api.stripe.com" },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: FONTS_HREF },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "shortcut icon", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.json" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Monarch Properties",
          description: "Professional property management platform",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          provider: { "@type": "Organization", name: "Monarch Properties" },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <div id="radix-portal-root" />
        <Scripts />
      </body>
    </html>
  );
}

/** Browser-only start-up work that previously ran in src/main.tsx. */
function useClientBootstrap() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const host = window.location.hostname;
      const isVercelHosted =
        host.endsWith(".vercel.app") || host === "monarchpropertymmgt.online" || host.endsWith("monarchpropertymmgt.online");
      if (isVercelHosted) {
        const { inject } = await import("@vercel/analytics");
        if (!cancelled) inject();
      }
      const [{ setupAutoOptimizations, preloadCriticalAssets }, { initializeCSRFProtection }] = await Promise.all([
        import("@/lib/performanceOptimizations"),
        import("@/utils/csrfProtection"),
      ]);
      if (cancelled) return;
      setupAutoOptimizations();
      preloadCriticalAssets();
      initializeCSRFProtection();

      if (import.meta.env.PROD) {
        const { initPerformanceMonitoring } = await import("@/utils/performanceMonitoring");
        if (cancelled) return;
        initPerformanceMonitoring();
        const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
        const run = () => {
          void import("@/utils/productionMonitoring").then(({ productionMonitor }) => {
            productionMonitor.checkPerformanceThresholds();
          });
        };
        if (idle) idle(run);
        else setTimeout(run, 3000);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useClientBootstrap();

  return (
    <div id="root">
      <GlobalErrorBoundary>
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <SessionProvider>
              <AuthProvider>
                <A11yProvider>
                  <UnifiedPerformanceMonitor />
                  <SpeedInsights />
                  <SecurityHeaders />
                  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <LanguageProvider>
                      <TooltipProvider>
                        <OptimizedSecurityProvider enableRateLimit={true}>
                          <Toaster />
                          <Suspense fallback={null}>
                            <CommandPalette />
                          </Suspense>
                          <OptimizedLayout>
                            <Suspense fallback={<LoadingSpinner minimal />}>
                              <Outlet />
                            </Suspense>
                          </OptimizedLayout>
                          <WhatsAppFloatingButton />
                          <SalesIQProvider />
                        </OptimizedSecurityProvider>
                      </TooltipProvider>
                    </LanguageProvider>
                  </ThemeProvider>
                </A11yProvider>
              </AuthProvider>
            </SessionProvider>
          </QueryClientProvider>
        </HelmetProvider>
      </GlobalErrorBoundary>
    </div>
  );
}

function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "root" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <h1 className="text-2xl font-semibold">This page didn't load</h1>
      <p className="max-w-md text-muted-foreground">
        Something went wrong on our side. Please try again — if it keeps happening, contact Monarch support at +1 (304)
        365-8349.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          onClick={() => {
            void router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
        <a href="/" className="rounded-md border border-border px-4 py-2">
          Go home
        </a>
      </div>
    </div>
  );
}
