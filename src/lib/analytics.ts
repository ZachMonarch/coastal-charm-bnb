/**
 * Analytics Instrumentation Library
 * 
 * Provides unified interface for tracking events across the application.
 * Vercel Analytics is enabled via @vercel/analytics package (see main.tsx).
 * This module provides additional tracking options for PostHog (recommended)
 * or GA4 and includes a safe no-op fallback in case no provider is configured.
 * 
 * PRODUCTION STATUS: Active
 * - Vercel Analytics: Enabled (automatic page views and web vitals)
 * - PostHog: Optional (configured via VITE_POSTHOG_API_KEY)
 * - Custom events: Logged to console in dev
 * 
 * @see Phase 3 Documentation: docs/design-system/PHASE_3_COMPLETION.md
 */

import posthog from 'posthog-js';

export type AnalyticsEvent =
  | "page_view"
  | "hero_cta_click"
  | "property_card_click"
  | "property_view"
  | "booking_initiated"
  | "form_submit_success"
  | "form_submit_error"
  | "faq_open"
  | "feature_card_click"
  | "search_query"
  | "filter_applied"
  | "video_play"
  | "external_link_click"
  | "cta_banner_click"
  | "navigation_click"
  | "download_brochure"
  | "contact_form_open";

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  provider?: "posthog" | "ga4" | "custom";
}

class Analytics {
  private config: AnalyticsConfig = {
    enabled: true,
    debug: import.meta.env.DEV,
    provider: undefined,
  };

  /**
   * Initialize analytics with configuration
   */
  init(config: Partial<AnalyticsConfig>) {
    this.config = { ...this.config, ...config };

    // If PostHog is configured, initialize it once on the client
    if (typeof window !== "undefined" && import.meta.env.VITE_POSTHOG_API_KEY) {
      const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';
      posthog.init(import.meta.env.VITE_POSTHOG_API_KEY, {
        api_host: posthogHost,
        loaded: (ph) => {
          if (this.config.debug) {
            console.log('[Analytics] PostHog initialized', ph);
          }
        },
      });
      this.config.provider = 'posthog';
    }

    if (this.config.debug) {
      console.log("[Analytics] Initialized with config:", this.config);
    }
  }

  /**
   * Track an analytics event
   * 
   * @example
   * trackEvent("hero_cta_click", { cta_text: "Get Started", page: "/properties" });
   */
  trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.config.enabled) return;

    const eventData = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      },
    };

    if (this.config.debug) {
      console.log("[Analytics] Event:", eventData);
    }

    if (this.config.provider === 'posthog' && typeof window !== 'undefined') {
      posthog.capture(event, eventData.properties);
    }

    // If other providers are added later (GA4, custom), they can be implemented here.
  }

  /**
   * Track page view (automatic)
   */
  trackPageView(pagePath?: string) {
    const path = pagePath || window.location.pathname;
    this.trackEvent("page_view", {
      page_path: path,
      page_title: document.title,
    });
  }

  /**
   * Identify user (for authenticated tracking)
   */
  identify(userId: string, traits?: Record<string, unknown>) {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log("[Analytics] Identify user:", userId, traits);
    }

    if (this.config.provider === 'posthog' && typeof window !== 'undefined') {
      posthog.identify(userId, traits);
    }
  }

  /**
   * Reset user identification (on logout)
   */
  reset() {
    if (!this.config.enabled) return;

    if (this.config.debug) {
      console.log("[Analytics] Reset user");
    }

    if (this.config.provider === 'posthog' && typeof window !== 'undefined') {
      posthog.reset();
    }
  }
}

// Singleton instance
export const analytics = new Analytics();

/**
 * Simple hook for tracking events (no React dependency)
 */
export function useAnalytics() {
  return {
    track: analytics.trackEvent.bind(analytics),
    page: analytics.trackPageView.bind(analytics),
    identify: analytics.identify.bind(analytics),
    reset: analytics.reset.bind(analytics),
  };
}

// Initialize analytics on module load
if (typeof window !== "undefined") {
  analytics.init({
    enabled: true,
    debug: import.meta.env.DEV,
  });
}
